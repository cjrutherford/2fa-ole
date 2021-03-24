import Keyv from 'keyv';
import  {KeyvFile} from 'keyv-file';
import {authenticator} from 'otplib';
import QRCode  from 'qrcode';


export default class LocalStorage{
    secretCache: Keyv = new Keyv({store: new KeyvFile({
        filename: 'secrets.json',
        writeDelay: 100,
        encode: JSON.stringify,
        decode: JSON.parse
    })});
    userCache: Keyv = new Keyv({store: new KeyvFile({
        filename: 'users.json',
        writeDelay: 100,
        encode: JSON.stringify,
        decode: JSON.parse
    })});
    private static instance: LocalStorage;
    private constructor(){}
    public static getInstance(){
        if(!this.instance){
            this.instance = new LocalStorage();
        }
        return this.instance;
    }

    async addUser(username: string, password: string){
        try{
            const existing = await this.userCache.get(username);
            if(existing) throw new Error('User Exists');
            
            const createResult = await this.userCache.set(username, {twoFactor: false, password});
            if(!createResult) throw new Error('Issue Setting User.');

            return createResult;
        }catch(e) {
            throw e;
        }
    }

    async login(username: string, password: string, code?: string){
        try {
            const userRecord = await this.userCache.get(username);
            if(!userRecord) throw new Error('Unable to find user in cache.');
            if(!!userRecord.twoFactor && !!code){
                // verify the 2fa token code.
                const secret = await this.secretCache.get(username);
                if(!secret) {
                    await this.userCache.set(username, {...userRecord, twoFactor: false})
                    throw new Error('No Secret for this user. Re-enable TFA');
                }
                const validCode = authenticator.verify({secret, token: code});
                if(validCode){
                    return true;
                } else {
                    return false;
                }
            } else if (!!userRecord.twoFactor && !code){
                throw new Error('Unabfle to sign in user. Two Factor is enabled, but no code provided.');
            } else {
                return password === userRecord.password;
            }
        } catch (error) {
            console.error(error);
        }
    }

    async resetPassword(username: string, oldP: string, newP: string){
        try{
            const existing = await this.userCache.get(username);
            if(!existing) throw new Error("user for update doesn't exist");

            if(oldP === existing){
                const update = await this.userCache.set(username, {...existing, password:newP});
                if(!update) throw new Error('unable to update user password');
                return update;
            }
        } catch(e) {
            throw e;
        }
    }

    async enable2fa(user: string, password: string) {
        try {
            const existing = await this.userCache.get(user);
            //generate secret and return as a QR Code.
            const secret = authenticator.generateSecret();
            // set the secret into the user object.
            if(existing.password === password){
                const code = await this.generateQRcode(user, secret);
                const secretSaved = await this.secretCache.set(user, secret);
                if(!secretSaved) throw new Error('Error Saving secret to cache.');
                const userUpdated = await this.userCache.set(user, {...existing, twoFactor: true});
                if(!userUpdated) throw new Error('unable to save TFA for user. Please try again.');
                return code;
            } else {
                throw new Error('Passwords do not match. Please Try again.')
            }
        } catch (error) {
            throw error;
        }
    }

    async generateQRcode(user: string, secret: string){
        try {
            const otp = authenticator.keyuri(user, "TFA Testing", secret);
            const img = await QRCode.toDataURL(otp);
            return img;
        } catch (e) {
            console.error(e);
        }
    }
}