import { hash, compare } from "bcrypt-ts";
export async function hashPassword(plainPassword) {
    return hash(plainPassword, 10).then((hashedPassword) => {
        return hashedPassword;
    });
}
export async function verifyPassword(plainPassword, hashedPassword) {
    return compare(plainPassword, hashedPassword).then((isValid) => {
        return isValid;
    });
}
