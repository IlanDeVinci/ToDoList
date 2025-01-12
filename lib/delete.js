import supabase from "./init.js";
import user from "./login.js";
const deleteUser = async () => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const response = await supabase
        .from("user")
        .delete()
        .eq("id", "b6372f8e-c265-4dc8-9213-ccffe5ee1436");
    return response;
};
const userDeleted = deleteUser();
