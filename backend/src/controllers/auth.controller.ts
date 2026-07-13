import { Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_medilink_ai_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_medilink_ai_2026';

export class AuthController {
  static async register(req: Request, res: Response) {
    const { email, phone, password, role, fullName, ...profileData } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    try {
      // Check duplicate
      const existingUser = await prisma.user.findUnique({ where: { phone } });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this phone number already exists.' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate a mock OTP code for registration
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      // Create base user
      const user = await prisma.user.create({
        data: {
          email,
          phone,
          passwordHash,
          role: (role as Role) || Role.PATIENT,
          isVerified: false,
          otpCode,
          otpExpiresAt,
        },
      });

      // Create corresponding profile based on role
      const name = fullName || 'New User';
      if (user.role === Role.PATIENT) {
        await prisma.patientProfile.create({
          data: {
            userId: user.id,
            fullName: name,
            gender: profileData.gender || 'Unknown',
            dateOfBirth: new Date(profileData.dateOfBirth || '1990-01-01'),
            bloodGroup: profileData.bloodGroup || 'O+',
          },
        });
      } else if (user.role === Role.DOCTOR) {
        await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            fullName: name,
            specialty: profileData.specialty || 'General Medicine',
            licenseNumber: profileData.licenseNumber || `LIC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            hospitalId: profileData.hospitalId,
          },
        });
      } else if (user.role === Role.PHARMACY) {
        await prisma.pharmacyProfile.create({
          data: {
            userId: user.id,
            name: name,
            address: profileData.address || 'Ethiopia',
            contactNumber: phone,
            latitude: profileData.latitude || 9.03,
            longitude: profileData.longitude || 38.75,
          },
        });
      } else if (user.role === Role.LAB_STAFF) {
        await prisma.labProfile.create({
          data: {
            userId: user.id,
            name: name,
            address: profileData.address || 'Ethiopia',
            contactNumber: phone,
          },
        });
      } else if (user.role === Role.AMBULANCE_DRIVER) {
        await prisma.ambulanceDriverProfile.create({
          data: {
            userId: user.id,
            driverName: name,
            vehicleNumber: profileData.vehicleNumber || `CODE-3-A${Math.floor(10000 + Math.random() * 90000)}`,
            latitude: profileData.latitude || 9.0125,
            longitude: profileData.longitude || 38.7595,
          },
        });
      }

      console.log(`[SMS OTP Notification] Sent to ${phone}: ${otpCode}`);

      res.status(201).json({
        message: 'Registration successful. OTP sent via SMS.',
        userId: user.id,
        phone: user.phone,
        role: user.role,
        otpDemo: otpCode, // Send back in dev response for ease of clinical testing
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
  }

  static async verifyOTP(req: Request, res: Response) {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { phone } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      if (user.otpCode !== code) {
        return res.status(400).json({ error: 'Incorrect OTP code.' });
      }

      if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
        return res.status(400).json({ error: 'OTP has expired.' });
      }

      // Mark user as verified
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          otpCode: null,
          otpExpiresAt: null,
        },
      });

      res.status(200).json({ message: 'Phone number verified successfully.' });
    } catch (error) {
      console.error('OTP Verification error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  static async login(req: Request, res: Response) {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password are required.' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          patientProfile: true,
          doctorProfile: true,
          pharmacyProfile: true,
          labProfile: true,
          ambulanceDriver: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid phone number or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid phone number or password.' });
      }

      // Generate Access Token (expires in 1 hour)
      const accessToken = jwt.sign(
        { id: user.id, phone: user.phone, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Generate Refresh Token (expires in 7 days)
      const refreshToken = jwt.sign(
        { id: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      // Save refresh token to db
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Get appropriate profile metadata
      let profile = null;
      if (user.role === Role.PATIENT) profile = user.patientProfile;
      else if (user.role === Role.DOCTOR) profile = user.doctorProfile;
      else if (user.role === Role.PHARMACY) profile = user.pharmacyProfile;
      else if (user.role === Role.LAB_STAFF) profile = user.labProfile;
      else if (user.role === Role.AMBULANCE_DRIVER) profile = user.ambulanceDriver;

      res.status(200).json({
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profile,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    try {
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(403).json({ error: 'Expired or invalid refresh token.' });
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { id: storedToken.user.id, phone: storedToken.user.phone, role: storedToken.user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.status(200).json({ accessToken });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }

  static async logout(req: Request, res: Response) {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required.' });
    }

    try {
      await prisma.refreshToken.deleteMany({ where: { token } });
      res.status(200).json({ message: 'Logged out successfully.' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
}
