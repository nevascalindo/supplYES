/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Review {
  id: string;
  author: string;
  company: string;
  rating: number;
  comment: string;
  date: string;
}

export interface CatalogItem {
  name: string;
  price: string;
  immediateAvailable: boolean;
  unit: string;
}

export interface Supplier {
  id: string;
  name: string;
  logo: string; // Icon identifier or styled initials
  category: string;
  location: string;
  rating: number;
  reviewsCount: number;
  fastDelivery: boolean; // Entrega imediata em emergências
  deliveryTime: string; // Ex: "Imediato (20-40 min)"
  minOrderValue: number;
  whatsappUrl: string;
  description: string;
  tags: string[];
  catalogItems: CatalogItem[];
  reviews: Review[];
  verified: boolean;
  contactEmail: string;
  contactPhone: string;
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  description: string;
}

export interface EmpreendedorProfile {
  nomeCompleto: string;
  nomeEmpresa: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  foto: string;
}

export interface FornecedorProfile {
  nomeEmpresa: string;
  nichoCategoria: string;
  email: string;
  telefone: string;
  endereco: string;
  fotoPerfil: string;
  cnpj: string;
  descricao?: string;
}

export type UserType = "empreendedor" | "fornecedor";

export interface UserSession {
  userType: UserType | null;
  password?: string;
  empreendedorData: EmpreendedorProfile | null;
  fornecedorData: FornecedorProfile | null;
}

