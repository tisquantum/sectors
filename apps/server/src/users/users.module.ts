import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '@server/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
})
export class UsersModule {}
