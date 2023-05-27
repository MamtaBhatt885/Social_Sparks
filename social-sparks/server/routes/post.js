import express  from "express";
import { commentOnPost, createPost, deleteComment, deletePost, getPostOffFollowing, likeAndUnlikePost, updateCaption} from "../controllers/post.js";
import isAuthenticated from "../middleware/auth.js";


const router = express.Router();

router.route("/post/upload").post(isAuthenticated, createPost);

router
.route("/post/:id")
.get(isAuthenticated,likeAndUnlikePost)
.put(isAuthenticated, updateCaption)
.delete(isAuthenticated,deletePost);


router.route("/posts").get(isAuthenticated, getPostOffFollowing);

router.route("/post/comment/:id").put(isAuthenticated,commentOnPost).delete(isAuthenticated,deleteComment);

export default router;