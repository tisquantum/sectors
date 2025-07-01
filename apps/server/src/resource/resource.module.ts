import { Module } from '@nestjs/common';
import { ResourceService } from './resource.service';

@Module({
  providers: [ResourceService],
  exports: [ResourceService],
})
export class ResourceModule {} 