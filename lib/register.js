import supabase from "./utils/init.js";
export const registerUser = async (email, password, firstName, lastName) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            },
        },
    });
    if (error) {
        console.error("Registration error:", error);
        throw error;
    }
    return data;
};
