import supabase from "../utils/init.js";
import user from "./../login.js";
const getUser = async (id) => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const { data, error } = await supabase
        .from("user")
        .select("id")
        .eq("id", id)
        .limit(1);
    if (error) {
        console.error(error);
        return false;
    }
    return data;
};
const insertComment = async (userId, comment) => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const dbUser = await getUser(userId);
    if (!dbUser || dbUser.length === 0) {
        return false;
    }
    const { error } = await supabase.from("comments").insert({
        user: dbUser[0].id,
        comment: comment,
    });
    if (error) {
        console.error(error);
        return false;
    }
    return true;
};
const insertTodo = async (userId, todo, description) => {
    const userLogged = await user;
    if (!userLogged) {
        return false;
    }
    const dbUser = await getUser(userId);
    if (!dbUser || dbUser.length === 0) {
        return false;
    }
    const { error } = await supabase.from("todo").insert({
        user: dbUser[0].id,
        title: todo,
        description: description,
    });
};
const commentInserted = insertComment("c90a2dd2-db93-4f77-a0e9-6fbef735071e", "Hello World");
const todoInserted = insertTodo("c90a2dd2-db93-4f77-a0e9-6fbef735071e", "Buy milk", "Go to the store and buy milk");
