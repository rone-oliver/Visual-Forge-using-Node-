import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/models/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersAuthService {
    constructor(private usersService: UsersService){ }
    async checkPassword(password: string, hashPassword: string): Promise<boolean>{
        return await bcrypt.compare(password, hashPassword)
    }

    async login(username: string, password: string){
        const user= await this.usersService.findOne({username});
        if(!user){
            throw new UnauthorizedException('User not found');
            // return ["User not found"];
        }
        const isPasswordValid= await this.checkPassword(password, user.password);
        if(!isPasswordValid){
            throw new UnauthorizedException('Invalid password');
            // return ["Invalid password"];
        }
        const token='fsdfdsd';
        return [user, token];
    }
    async register(userData: User): Promise<User> {
        return this.usersService.createUser(userData);
    }
}
