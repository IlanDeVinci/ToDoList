import supabase from "./init.js";
import user from "./login.js";
import { hashPassword } from "./hash.js";
const updateUser = async () => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const pwd = await hashPassword("plainPassword");
    const { data, error } = await supabase
        .from("user")
        .update({
        password: pwd,
    })
        .eq("id", "c90a2dd2-db93-4f77-a0e9-6fbef735071e")
        .select();
    if (error) {
        console.error(error);
        return false;
    }
    console.log(data);
    return true;
};
const userUpdated = updateUser();
