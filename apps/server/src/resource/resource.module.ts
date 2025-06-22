import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {} 