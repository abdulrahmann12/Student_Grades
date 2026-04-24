export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"],
                mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular"],
            },
            boxShadow: {
                panel: "0 30px 70px -40px rgba(15, 23, 42, 0.45)",
            },
            backgroundImage: {
                mesh: "radial-gradient(circle at top left, rgba(20, 122, 116, 0.16), transparent 32%), radial-gradient(circle at 80% 0%, rgba(248, 180, 52, 0.12), transparent 24%)",
            },
        },
    },
    plugins: [],
};
