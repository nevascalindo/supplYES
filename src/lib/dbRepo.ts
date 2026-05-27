/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import { Supplier, Category, Review, CatalogItem } from "../types";
import { CATEGORIES, INITIAL_SUPPLIERS } from "../data";

/**
 * Simple SHA-256 password hashing helper that works in modern browsers
 * with a fallback for non-secure contexts.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  try {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (error) {
    console.error("Hashing failed, falling back to simple mock encryption", error);
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `fb_${hash}`;
  }
}

// Fallback Key Names for LocalStorage Cache when Supabase is not configured yet
const STORAGE_KEYS = {
  CATEGORIES: "suppleyes_categories",
  SUPPLIERS: "suppleyes_suppliers",
  EMERGENCY: "suppleyes_emergencies",
  PROFILES: "suppleyes_user_profiles"
};

// INITIAL DEFAULTS FOR EMERGENCIES if empty
const DEFAULT_EMERGENCIES = [
  {
    id: "sos-01",
    companyName: "Padaria Bella Vista",
    categoryName: "Alimentos e Insumos",
    categoryId: "alimentos",
    itemDescription: "Urgente: Ruptura de estoque de farinha especial tipo 00. Sem estoque para a fornada da noite!",
    address: "Pinheiros, São Paulo - SP",
    timestamp: "Previsão 45 min",
    lat: -23.5621,
    lng: -46.6853
  },
  {
    id: "sos-02",
    companyName: "Burger Joint Jardins",
    categoryName: "Embalagens e Descartáveis",
    categoryId: "embalagens",
    itemDescription: "Urgente: Sacolas kraft para delivery tamanho M acabaram. Delivery travado!",
    address: "Consolação, São Paulo - SP",
    timestamp: "Previsão 30 min",
    lat: -23.5552,
    lng: -46.6614
  }
];

export const dbRepo = {
  /**
   * 1. GET ALL CATEGORIES
   */
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });
        
        if (!error && data && data.length > 0) {
          return data.map(item => ({
            id: item.id,
            name: item.name,
            iconName: item.icon_name,
            description: item.description || ""
          }));
        }
      } catch (err) {
        console.warn("Erro ao obter categorias do Supabase. Utilizando fallback local.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (cached) return JSON.parse(cached);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(CATEGORIES));
    return CATEGORIES;
  },

  /**
   * 2. GET ALL SUPPLIERS (including joined catalog items and reviews)
   */
  async getSuppliers(): Promise<Supplier[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: sups, error: supErr } = await supabase
          .from("suppliers")
          .select(`
            *,
            catalog_items(*),
            reviews(*)
          `);

        if (!supErr && sups && sups.length > 0) {
          return sups.map(s => {
            const catalogItems: CatalogItem[] = (s.catalog_items || []).map((ci: any) => ({
              name: ci.name,
              price: ci.price,
              immediateAvailable: ci.immediate_available,
              unit: ci.unit
            }));

            const reviewsList: Review[] = (s.reviews || []).map((r: any) => ({
              id: r.id,
              author: r.author,
              company: r.company,
              rating: r.rating,
              comment: r.comment || "",
              date: r.date
            }));

            return {
              id: s.id,
              name: s.name,
              logo: s.logo,
              category: s.category || "alimentos",
              location: s.location,
              rating: Number(s.rating) || 5.0,
              reviewsCount: Number(s.reviews_count) || 0,
              fastDelivery: s.fast_delivery,
              deliveryTime: s.delivery_time || "A combinar",
              minOrderValue: Number(s.min_order_value) || 0,
              whatsappUrl: s.whatsapp_url || "",
              description: s.description || "",
              tags: s.tags || [],
              verified: s.verified,
              contactEmail: s.contact_email || "",
              contactPhone: s.contact_phone || "",
              catalogItems,
              reviews: reviewsList
            };
          });
        }
      } catch (err) {
        console.warn("Erro ao puxar fornecedores do Supabase. Utilizando fallback local.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (cached) return JSON.parse(cached);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(INITIAL_SUPPLIERS));
    return INITIAL_SUPPLIERS;
  },

  /**
   * 3. INSERTS OR UPDATES A SUPPLIER
   */
  async saveSupplier(supplier: Supplier): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        // Upsert Supplier row
        const { error } = await supabase.from("suppliers").upsert({
          id: supplier.id,
          name: supplier.name,
          logo: supplier.logo,
          category: supplier.category,
          location: supplier.location,
          rating: supplier.rating,
          reviews_count: supplier.reviewsCount,
          fast_delivery: supplier.fastDelivery,
          delivery_time: supplier.deliveryTime,
          min_order_value: supplier.minOrderValue,
          whatsapp_url: supplier.whatsappUrl,
          description: supplier.description,
          tags: supplier.tags,
          verified: supplier.verified,
          contact_email: supplier.contactEmail,
          contact_phone: supplier.contactPhone
        });

        if (error) throw error;

        // Clear existing catalog items and reinsert them (simplified sync)
        await supabase.from("catalog_items").delete().eq("supplier_id", supplier.id);
        if (supplier.catalogItems && supplier.catalogItems.length > 0) {
          const insertPayload = supplier.catalogItems.map(item => ({
            supplier_id: supplier.id,
            name: item.name,
            price: item.price,
            immediate_available: item.immediateAvailable,
            unit: item.unit
          }));
          await supabase.from("catalog_items").insert(insertPayload);
        }

        // Clear existing reviews and reinsert them (simplified sync)
        await supabase.from("reviews").delete().eq("supplier_id", supplier.id);
        if (supplier.reviews && supplier.reviews.length > 0) {
          const reviewPayload = supplier.reviews.map(rev => ({
            id: rev.id.includes("rev-") ? undefined : rev.id, // Generate real UUIDs for new reviews
            supplier_id: supplier.id,
            author: rev.author,
            company: rev.company,
            rating: rev.rating,
            comment: rev.comment,
            date: rev.date
          }));
          await supabase.from("reviews").insert(reviewPayload);
        }

        return;
      } catch (err) {
        console.error("Erro ao salvar fornecedor no Supabase, tentando local.", err);
      }
    }

    // Local Fallback
    const current = await this.getSuppliers();
    const existingIdx = current.findIndex(s => s.id === supplier.id);
    if (existingIdx !== -1) {
      current[existingIdx] = supplier;
    } else {
      current.push(supplier);
    }
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(current));
  },

  /**
   * 4. GET ALL EMERGENCY ALERTS SOS
   */
  async getEmergencyRequests(): Promise<any[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("emergency_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map(item => ({
            id: item.id,
            companyName: item.company_name,
            categoryName: item.category_name,
            categoryId: item.category_id,
            itemDescription: item.item_description,
            address: item.address,
            timestamp: item.timestamp,
            lat: Number(item.lat),
            lng: Number(item.lng)
          }));
        }
      } catch (err) {
        console.warn("Erro ao buscar chamados SOS no Supabase. Utilizando fallback local.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem(STORAGE_KEYS.EMERGENCY);
    if (cached) return JSON.parse(cached);
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(DEFAULT_EMERGENCIES));
    return DEFAULT_EMERGENCIES;
  },

  /**
   * 5. REGISTER NEW EMERGENCY REQUEST ALERT
   */
  async saveEmergencyRequest(req: any): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("emergency_requests").insert({
          id: req.id,
          company_name: req.companyName,
          category_name: req.categoryName,
          category_id: req.categoryId,
          item_description: req.itemDescription,
          address: req.address,
          timestamp: req.timestamp,
          lat: req.lat,
          lng: req.lng
        });
        if (!error) return;
        throw error;
      } catch (err) {
        console.error("Erro ao salvar alerta no Supabase.", err);
      }
    }

    // Local Fallback
    const list = await this.getEmergencyRequests();
    const newList = [req, ...list];
    localStorage.setItem(STORAGE_KEYS.EMERGENCY, JSON.stringify(newList));
  },

  /**
   * 6. GET PROFILE BY REGISTERED EMAIL
   */
  async getUserProfile(email: string): Promise<{ role: string; password?: string; data: any } | null> {
    if (!email) return null;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle();

        if (!error && data) {
          return {
            role: data.role,
            password: data.password || "",
            data: data.data
          };
        }
      } catch (err) {
        console.warn("Erro ao ler busca de perfil no Supabase.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (cached) {
      const profiles = JSON.parse(cached);
      const match = profiles.find((p: any) => p.email.toLowerCase().trim() === email.toLowerCase().trim());
      if (match) {
        return {
          role: match.role,
          password: match.password || "",
          data: match.data
        };
      }
    }
    return null;
  },

  /**
   * 7. INSERT PROFILE (MEMBER REGISTRATION DATA)
   */
  async saveUserProfile(role: string, email: string, password?: string, data?: any): Promise<void> {
    if (!email) return;

    let securePassword = password || "";
    if (securePassword && !securePassword.startsWith("sha256_")) {
      const hashed = await hashPassword(securePassword);
      securePassword = "sha256_" + hashed;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("user_profiles").upsert({
          email: email.toLowerCase().trim(),
          role,
          password: securePassword,
          data
        }, { onConflict: "email" });

        if (!error) return;
        throw error;
      } catch (err) {
        console.error("Erro ao gravar perfil de usuário no Supabase.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem(STORAGE_KEYS.PROFILES);
    const profiles = cached ? JSON.parse(cached) : [];
    const idx = profiles.findIndex((p: any) => p.email.toLowerCase().trim() === email.toLowerCase().trim());

    const payload = {
      email: email.toLowerCase().trim(),
      role,
      password: securePassword,
      data
    };

    if (idx !== -1) {
      profiles[idx] = payload;
    } else {
      profiles.push(payload);
    }

    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  },

  /**
   * 8. GET ALL EMPLOYEES FOR A GESTOR EMAIL
   */
  async getEmployees(userEmail: string): Promise<any[]> {
    if (!userEmail) return [];

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("user_email", userEmail.toLowerCase().trim())
          .order("created_at", { ascending: false });

        if (!error && data) {
          return data.map(item => ({
            id: item.id,
            userEmail: item.user_email,
            name: item.name,
            role: item.role,
            email: item.email,
            phone: item.phone || ""
          }));
        }
      } catch (err) {
        console.error("Erro ao puxar colaboradores do Supabase.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem("suppleyes_employees");
    const employees = cached ? JSON.parse(cached) : [];
    return employees.filter((e: any) => e.userEmail.toLowerCase().trim() === userEmail.toLowerCase().trim());
  },

  /**
   * 9. SAVE/UPSERT EMPLOYEE
   */
  async saveEmployee(emp: any): Promise<void> {
    if (!emp.userEmail) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from("employees").upsert({
          id: emp.id && emp.id.startsWith("emp-") ? undefined : emp.id, // Only use uuid if not local custom prefix
          user_email: emp.userEmail.toLowerCase().trim(),
          name: emp.name,
          role: emp.role,
          email: emp.email,
          phone: emp.phone
        });

        if (!error) return;
        throw error;
      } catch (err) {
        console.error("Erro ao salvar colaborador no Supabase.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem("suppleyes_employees");
    const employees = cached ? JSON.parse(cached) : [];
    const idx = employees.findIndex((e: any) => e.id === emp.id);

    if (idx !== -1) {
      employees[idx] = emp;
    } else {
      employees.push(emp);
    }

    localStorage.setItem("suppleyes_employees", JSON.stringify(employees));
  },

  /**
   * 10. DELETE EMPLOYEE BY ID
   */
  async deleteEmployee(empId: string): Promise<void> {
    if (!empId) return;

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from("employees")
          .delete()
          .eq("id", empId);

        if (!error) return;
        throw error;
      } catch (err) {
        console.error("Erro ao excluir colaborador no Supabase.", err);
      }
    }

    // Local Fallback
    const cached = localStorage.getItem("suppleyes_employees");
    if (cached) {
      const employees = JSON.parse(cached);
      const filtered = employees.filter((e: any) => e.id !== empId);
      localStorage.setItem("suppleyes_employees", JSON.stringify(filtered));
    }
  }
};
