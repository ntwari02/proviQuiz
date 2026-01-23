import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import readline from "node:readline";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

async function askQuestion(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log("=== Create Admin Account ===\n");

    const email = await askQuestion(rl, "Email: ");
    if (!email || !email.includes("@")) {
      console.error("Invalid email address");
      process.exit(1);
    }

    const name = await askQuestion(rl, "Name (optional): ");

    const password = await askQuestion(rl, "Password (min 6 characters): ");
    if (!password || password.length < 6) {
      console.error("Password must be at least 6 characters");
      process.exit(1);
    }

    const roleInput = await askQuestion(rl, "Role (admin/superadmin) [default: admin]: ");
    const role = roleInput.toLowerCase() === "superadmin" ? "superadmin" : "admin";

    console.log("\nConnecting to database...");
    await mongoose.connect(MONGO_URI, { dbName: "proviQuiz" });

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log(`\nUser with email ${email} already exists.`);
      const update = await askQuestion(rl, "Do you want to update their role to " + role + "? (y/n): ");
      if (update.toLowerCase() === "y") {
        existing.role = role as "admin" | "superadmin";
        if (password) {
          existing.passwordHash = await bcrypt.hash(password, 10);
        }
        await existing.save();
        console.log(`\n✅ User updated successfully!`);
        console.log(`   Email: ${existing.email}`);
        console.log(`   Role: ${existing.role}`);
      } else {
        console.log("Cancelled.");
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const createBody: any = {
        email: email.toLowerCase(),
        passwordHash,
        role,
      };
      if (name) createBody.name = name;

      const user = await User.create(createBody);
      console.log(`\n✅ Admin account created successfully!`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || "(not set)"}`);
      console.log(`   Role: ${user.role}`);
    }

    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  } catch (err) {
    console.error("\n❌ Error:", err);
    try {
      await mongoose.disconnect();
    } catch {}
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
