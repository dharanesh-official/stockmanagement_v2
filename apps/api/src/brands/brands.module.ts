import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';

@Module({
  imports: [JwtModule],
  controllers: [BrandsController],
  providers: [BrandsService],
})
export class BrandsModule {}
