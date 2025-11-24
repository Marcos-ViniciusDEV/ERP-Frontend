
import { api } from "./src/lib/api";
import axios from "axios";

async function checkProducts() {
  try {
    const response = await axios.get("http://localhost:3000/api/produtos");
    const products = response.data;
    console.log("Total products:", products.length);
    const fanta = products.find((p: any) => p.descricao.toLowerCase().includes("fanta"));
    if (fanta) {
      console.log("Found Fanta:", fanta);
    } else {
      console.log("Fanta NOT found in the list.");
      console.log("First 5 products:", products.slice(0, 5).map((p: any) => p.descricao));
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

checkProducts();
