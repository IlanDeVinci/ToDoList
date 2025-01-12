import supabase from "./init.js";
import user from "./login.js";
const getUsers = async () => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const { data, error } = await supabase.from("user").select("*");
    if (error) {
        console.error(error);
        return error.message;
    }
    console.log(data);
    return data;
};
const users = getUsers();
