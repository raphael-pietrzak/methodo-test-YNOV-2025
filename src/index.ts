import * as express from "express";
import Router from "./router";
const serverPort = 9000;

const app: express.Express = express();
const router = new Router(app);

router.init().setupRoutes();

app.listen(serverPort, () => console.info(`Listening on port ${serverPort}`));
