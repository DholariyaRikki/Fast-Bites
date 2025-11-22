import express from "express";
import { checkAuth, forgotPassword, login, logout, resetPassword, resendVerificationCode, signup, updateProfile, verifyEmail, superadminListUsers, superadminChangeUserRole } from "../controller/user.controller";
import { isAuthenticated, isSuperAdmin } from "../middlewares/isAuthenticated";

const router = express.Router();

router.route("/check-auth").get(isAuthenticated, checkAuth);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/verify-email").post(verifyEmail);
router.route("/resend-verification-code").post(resendVerificationCode);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);
router.route("/profile/update").put(isAuthenticated,updateProfile);

// SuperAdmin-only user management
router.route("/superadmin/users").get(isAuthenticated, isSuperAdmin, superadminListUsers);
router.route("/superadmin/users/:userId/role").put(isAuthenticated, isSuperAdmin, superadminChangeUserRole);

export default router;
