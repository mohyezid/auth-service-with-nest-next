import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ActivationDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/user.dto';
import { LoginResponse, RegisterResponse } from './types/user.types';
import { PrismaService } from '../../../prisma/Prisma.Service';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email/email.service';
import { TokenSender } from './utils/sendToken';
import { User } from '@prisma/client';

interface UserData {
  name: string;
  email: string;
  password: string;
  phone_number: number;
}

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}
  async register(registerDto: RegisterDto, response: Response) {
    const { email, name, password, phone_number } = registerDto;
    const isEmailExist = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (isEmailExist) {
      throw new BadRequestException('Email already exists');
    }
    const isPhoneExist = await this.prismaService.user.findUnique({
      where: { phone_number: phone_number },
    });
    if (isPhoneExist) {
      throw new BadRequestException('phone number already exists');
    }
    const hashpass = await bcrypt.hash(password, 10);
    const user = {
      email: email,
      name: name,
      password: hashpass,
      phone_number: phone_number,
    };

    const activationToken = await this.createActivationToken(user);

    const activation_token = activationToken.token;
    await this.emailService.sendMail({
      email,
      subject: 'Acctivate your account',
      template: './activation-mail',
      name,
      activationCode: activationToken.activationCode,
    });
    return { activation_token, response };
  }

  //create activation and token information

  async createActivationToken(user: UserData) {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = this.jwtService.sign(
      { user, activationCode },
      { secret: this.configService.get('ACTIVATION_SECRET'), expiresIn: '5m' },
    );
    return { token, activationCode };
  }

  async activateUser(activationDto: ActivationDto, response: Response) {
    const { activationCode, activationToken } = activationDto;
    const newUser: { user: UserData; activationCode: string } =
      this.jwtService.verify(activationToken, {
        secret: this.configService.get<string>('ACTIVATION_SECRET'),
      });
    if (newUser.activationCode !== activationCode) {
      throw new BadRequestException('Invalid activation code');
    }
    const { name, email, password, phone_number } = newUser.user;
    const existUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existUser) {
      throw new BadRequestException('user alread exists');
    }
    const user = await this.prismaService.user.create({
      data: { name, email, password, phone_number },
    });
    return { user, response };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (user && (await this.comparePassword(password, user.password))) {
      const tokenSender = new TokenSender(this.configService, this.jwtService);
      return tokenSender.sendToken(user);
    } else {
      return {
        user: null,
        accessToken: null,
        refreshToken: null,
        error: {
          message: 'Invalid email or password',
        },
      };
    }
  }
  async generateForgotPasswordLink(user: User) {
    const forgotPasswordToken = this.jwtService.sign(
      { user: user },
      {
        secret: this.configService.get<string>('FORGOT_PASSWORD_SECRET'),

        expiresIn: '5m',
      },
    );
    return forgotPasswordToken;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('user not found');
    }
    const forgotPasswordToken = this.generateForgotPasswordLink(user);
    const resetPasswordUrl =
      this.configService.get<string>('CLIENT_SIDE_URL') +
      `/reset-Password?verify=${forgotPasswordToken}`;
    await this.emailService.sendMail({
      email,
      subject: 'Reset your password',
      template: './forgot-password',
      name: user.name,
      activationCode: resetPasswordUrl,
    });
    console.log(forgotPasswordToken);
    return { message: `your forgot password request succesful!` };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { activationToken, password } = resetPasswordDto;
    const decode = await this.jwtService.decode(activationToken);
    if (!decode || decode?.exp * 1000 < Date.now()) {
      throw new BadRequestException(`Invalid activation token`);
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.update({
      where: { id: decode.user.id },
      data: { password: hashedpassword },
    });
    return { user };
  }

  async getLoggedInUser(req: any) {
    const user = req.user;
    const refreshToken = req.refreshtoken;
    const accessToken = req.accesstoken;
    console.log({ user, refreshToken, accessToken });
    return { user, refreshToken, accessToken };
  }
  async Logout(req: any) {
    req.user = null;
    req.refreshtoken = null;
    req.accesstoken = null;
    return {
      message: 'Logged out successfully',
    };
  }
  async comparePassword(password: string, hashpass: string): Promise<boolean> {
    return bcrypt.compare(password, hashpass);
  }
  async getUser() {
    return this.prismaService.user.findMany({});
  }
}
