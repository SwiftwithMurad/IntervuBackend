import { NextFunction, Response } from "express";
import { AuthRequest } from "../middlewares/auth";

export async function getPaywall(
  _req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json({
      currency: "USD",
      products: [
        {
          id: "intervu_premium_monthly",
          name: "Intervu Pro Monthly",
          price: 7.99,
          period: "monthly",
        },
        {
          id: "intervu_premium_yearly",
          name: "Intervu Pro Yearly",
          price: 49.99,
          period: "yearly",
        },
      ],
      proFeatures: [
        "Unlimited interview history",
        "Ideal answer in detailed feedback",
        "Extended post-session insights",
      ],
    });
  } catch (e) {
    next(e);
  }
}
