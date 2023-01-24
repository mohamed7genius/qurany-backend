const http = require("http");
const user_rotes = require("./routes/user_routes");
const server = http.createServer(user_rotes);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
