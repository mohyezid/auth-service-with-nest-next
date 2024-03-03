import { Field, InputType } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  isEmail,
  minLength,
} from 'class-validator';

@InputType()
export class RegisterDto {
  @Field()
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'Name must need to be one string' })
  name: string;

  @Field()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8, { message: 'password must be atleaset 8 chracters' })
  password: string;

  @Field()
  @IsNotEmpty({ message: 'Emai is required' })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Phone is required' })
  @IsEmail({}, { message: 'Phone is invalid' })
  phone_number: number;
}
@InputType()
export class ActivationDto {
  @Field()
  @IsNotEmpty({ message: 'Activation Token is required' })
  activationToken: string;
  @Field()
  @IsNotEmpty({ message: 'Activation Code is required' })
  activationCode: string;
}
@InputType()
export class LoginDto {
  @Field()
  @IsNotEmpty({ message: 'Emai is required' })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8, { message: 'password must be atleaset 8 chracters' })
  password: string;
}

@InputType()
export class ForgotPasswordDto {
  @Field()
  @IsNotEmpty({ message: 'Emai is required' })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}

@InputType()
export class ResetPasswordDto {
  @Field()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8, { message: 'password must be atleaset 8 chracters' })
  password: string;

  @Field()
  @IsNotEmpty({ message: 'Activation Token is required' })
  activationToken: string;
}
