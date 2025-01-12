import supabase from "./init.js";
const register = async () => {
    const { data, error } = await supabase.auth.signUp({
        email: "ilan.maouchi@gmail.com",
        password: "Password",
    });
    if (error) {
        console.error("error", error);
        return false;
    }
    console.log(data);
    return data;
};
const user = register();
