import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseStrategy } from '@server/strategy/supabase.strategy';
import { PassportModule } from '@nestjs/passport';
// import supabase from '../../supabase'; TODO: Do we need this?

@Module({
  imports: [PassportModule],
  providers: [AuthService, SupabaseStrategy],
  exports: [AuthService, SupabaseStrategy],
})
export class AuthModule {}
