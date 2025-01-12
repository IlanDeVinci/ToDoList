import supabase from "./init.js";
import user from "./login.js";
import { hashPassword } from "./hash.js";
const createUser = async (firstname, lastname, email, password) => {
    // Authentification
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const hashedPassword = await hashPassword(password);
    const { error } = await supabase.from("user").insert({
        firstname: firstname,
        lastname: lastname,
        email: email,
        password: hashedPassword,
    });
    if (error) {
        console.error(error);
        return false;
    }
    return true;
};
const createdUser = createUser("Jane", "Doe", "janedoe@gmail.com", "password");
