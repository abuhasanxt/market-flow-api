
import app from "./app";
const port = 5000; // The port your express server will be running on.
// Start the server

const  bootstrap=()=>{
try {
    app.listen(port,()=>{
    console.log(`Server is running on http://localhost:${port}`)
})
} catch (error) {
    console.error("Failed to start server: ", error)
}
}

bootstrap()