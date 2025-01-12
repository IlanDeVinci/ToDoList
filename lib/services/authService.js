import supabase from "../utils/init.js";
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
    if (error)
        throw error;
    return data;
};
export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error)
        throw error;
    return data;
};
