import {Account, Avatars, Client, OAuthProvider} from "react-native-appwrite";
import * as Linking from "expo-linking";
import {openAuthSessionAsync} from "expo-web-browser";

export const config = {
    platform: "com.jsm.restate",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)
    .setPlatform(config.platform!);


export const avatar = new Avatars(client);
export const account = new Account(client);

export async function login() {
    try {

        // Create a redirect URI for the OAuth2 flow
        // This is where the user will be redirected after logging in
        const redirectUri = Linking.createURL("/");

        // Step 1: Initiate the OAuth2 flow with Google
        // This sends a request to Google to generate a login URL
        const response = await account.createOAuth2Token(
            OAuthProvider.Google, // Use Google as the authentication provider
            redirectUri // Pass the redirect URI for redirection after login
        )

        // Throw an error if the OAuth2 response is missing
        if (!response) throw new Error("Login failed");

        // Step 2: Open a web browser or in-app web view for the user to log in
        const browserResult = await openAuthSessionAsync(
            response.toString(), // URL provided by the OAuth2 response
            redirectUri          // Redirect URI to handle post-login actions
        );

        // Check if the login process in the browser was successful
        if (browserResult.type !== "success") throw new Error("Login failed");


        // Step 3: Extract important credentials (userId and secret) from the redirected URL
        const url = new URL(browserResult.url); // Parse the URL returned after login
        const secret = url.searchParams.get("secret")?.toString(); // Extract the "secret" token
        const userId = url.searchParams.get("userId")?.toString(); // Extract the "userId"

        // Validate the extracted credentials
        if (!secret || !userId) throw new Error("Login failed");

        // Step 4: Create a user session using the credentials
        const session = await account.createSession(userId, secret);


        // Check if the session creation was successful
        if (!session) throw new Error("Failed to create session");

        // Return true to indicate successful login
        return true;


    } catch (error: any) {
        // Log the error for debugging (optional)
        console.error("Error during login:", error.message);

        // Rethrow or handle the error appropriately if needed
        throw error;
    }
}

export async function logout() {
    try {
        await account.deleteSession("current");
    } catch (error: any) {

        console.error("Error during logout:", error.message);
        throw error;
        return false

    }
}

export async function getUser() {

    try {
        const response = await account.get()
        if (response.$id) {
            const userAvatar = avatar.getInitials(response.name);
            return {
                ...response,
                avatar: userAvatar.toString()
            }
        }
    } catch (error) {
    }
}