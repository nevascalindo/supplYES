/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, SlidersHorizontal, Package, UtensilsCrossed, Flame, 
  Truck, Wrench, Printer, Sparkles, X, Plus, Clock, Star, 
  MapPin, AlertCircle, CheckCircle2, RefreshCw, Send, ChevronRight, HelpCircle,
  User, LogOut, CreditCard, Lock, UserPlus, Check, AlertTriangle, Users, Map
} from "lucide-react";

import { CATEGORIES, INITIAL_SUPPLIERS } from "./data";
import { dbRepo, hashPassword } from "./lib/dbRepo";
import { isSupabaseConfigured, SUPABASE_SETUP_SQL } from "./lib/supabase";
import { Supplier, Review, UserSession, FornecedorProfile, EmpreendedorProfile, CatalogItem } from "./types";
import { SupplierCard } from "./components/SupplierCard";
import { SupplierDetailModal } from "./components/SupplierDetailModal";
import { SOSRequestModal } from "./components/SOSRequestModal";
import { SupplierSOSModal } from "./components/SupplierSOSModal";
import { EmergencyMap } from "./components/EmergencyMap";

const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "pinheiros": { lat: -23.5621, lng: -46.6853 },
  "centro": { lat: -23.5489, lng: -46.6388 },
  "moema": { lat: -23.5986, lng: -46.6616 },
  "vila mariana": { lat: -23.5824, lng: -46.6432 },
  "lapa": { lat: -23.5228, lng: -46.7029 },
  "itaim bibi": { lat: -23.5835, lng: -46.6865 },
  "itaim": { lat: -23.5835, lng: -46.6865 },
  "bras": { lat: -23.5358, lng: -46.6186 },
  "brás": { lat: -23.5358, lng: -46.6186 },
  "guarulhos": { lat: -23.4628, lng: -46.5333 },
  "zona sul": { lat: -23.6182, lng: -46.6713 },
  "zona leste": { lat: -23.5458, lng: -46.5386 },
  "zona oeste": { lat: -23.5385, lng: -46.7214 },
  "consolacao": { lat: -23.5532, lng: -46.6575 },
  "consolação": { lat: -23.5532, lng: -46.6575 }
};

const AD_CAMPAIGNS = [
  {
    title: "Em alta urgência, temos entrega tudo.",
    descLine1: "Se o estoque de insumos acabou no meio do pico de vendas ou um forno parou de esquentar, filtre os fornecedores expréss.",
    descLine2: "Conecte-se instantaneamente com parceiros e prestadores homologados na sua região de atuação com rapidez máxima.",
    tag: "Modo Crise de Estoque"
  },
  {
    title: "Forneça insumos em Joinville e todo território nacional.",
    descLine1: "Localize distribuidores credenciados prontos para socorrer seu comércio regional sem qualquer taxa abusiva.",
    descLine2: "Atendimento imediato direto via WhatsApp comercial com fretes urgentes de motoboy ou fiorino.",
    tag: "Destaque Regional"
  },
  {
    title: "Destaque sua distribuidora para milhares de comércios locais.",
    descLine1: "Apareça antes nas buscas de novos clientes necessitados no picos de consumo das pizzarias, padarias e hamburguerias.",
    descLine2: "Preços competitivos, contato direto via WhatsApp comercial e cadastro instantâneo de fardos em estoque.",
    tag: "Visibilidade Premium"
  }
];

export default function App() {
  // Loading and Simulation state
  const [isLoading, setIsLoading] = useState(true);
  const [activeAdIndex, setActiveAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAdIndex(prev => (prev + 1) % AD_CAMPAIGNS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadDatabaseData() {
      setIsLoading(true);
      try {
        const sups = await dbRepo.getSuppliers();
        setSuppliers(sups);
        const emergencies = await dbRepo.getEmergencyRequests();
        setEmergencyRequests(emergencies);
      } catch (err) {
        console.error("Erro ao carregar dados do banco:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDatabaseData();
  }, []);

  // DB States
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Filtering States - SUPPORTING MULTIPLE CATEGORY SELECTION simultaneously
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(6);

  // User Authenticated Mode & Control States
  const [session, setSession] = useState<UserSession>({
    userType: null, // Starts NULL for "primeira vez entrando no site" simulation
    empreendedorData: null,
    fornecedorData: null
  });

  const [showSidebar, setShowSidebar] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState<"empreendedor" | "fornecedor" | null>(null);
  const [activeTabSidebar, setActiveTabSidebar] = useState<"perfil" | "planos" | "produtos">("perfil");
  const [actionWarning, setActionWarning] = useState<{ type: "sos" | "anunciar"; message: string } | null>(null);
  const [activeRoute, setActiveRoute] = useState<"hub" | "perfil" | "planos" | "produtos" | "sos_dashboard">("hub");

  // Scroll to top of page when changing view/route
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeRoute]);
  
  const [selectedEmergencyRequestId, setSelectedEmergencyRequestId] = useState<string | null>(null);
  const [emergencyRequests, setEmergencyRequests] = useState<any[]>([]);

  // Database lookups
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupPassword, setLookupPassword] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);

  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [activePlan, setActivePlan] = useState<"gratuito" | "bronze" | "prata" | "ouro">("gratuito");

  // Employees lists state
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [empNewName, setEmpNewName] = useState("");
  const [empNewRole, setEmpNewRole] = useState("");
  const [empNewEmail, setEmpNewEmail] = useState("");
  const [empNewPhone, setEmpNewPhone] = useState("");

  useEffect(() => {
    async function fetchEmployees() {
      const email = session.userType === "empreendedor" 
        ? session.empreendedorData?.email 
        : session.fornecedorData?.email;
      if (email) {
        const emps = await dbRepo.getEmployees(email);
        setEmployeesList(emps);
      } else {
        setEmployeesList([]);
      }
    }
    fetchEmployees();
  }, [session]);

  useEffect(() => {
    if (session.userType === "empreendedor" && session.empreendedorData) {
      dbRepo.saveUserProfile(
        "empreendedor",
        session.empreendedorData.email,
        session.password || "",
        session.empreendedorData
      ).catch(err => console.error("Falha ao salvar perfil de empreendedor:", err));
    } else if (session.userType === "fornecedor" && session.fornecedorData) {
      dbRepo.saveUserProfile(
        "fornecedor",
        session.fornecedorData.email,
        session.password || "",
        session.fornecedorData
      ).catch(err => console.error("Falha ao salvar perfil de fornecedor:", err));
    }
  }, [session]);

  useEffect(() => {
    if (session.userType === "empreendedor" && session.empreendedorData) {
      setEmpNomeCompleto(session.empreendedorData.nomeCompleto);
      setEmpNomeEmpresa(session.empreendedorData.nomeEmpresa);
      setEmpCpfCnpj(session.empreendedorData.cpfCnpj);
      setEmpEmail(session.empreendedorData.email);
      setEmpTelefone(session.empreendedorData.telefone);
      setEmpEndereco(session.empreendedorData.endereco);
      setEmpFoto(session.empreendedorData.foto);
    } else if (session.userType === "fornecedor" && session.fornecedorData) {
      setForNomeEmpresa(session.fornecedorData.nomeEmpresa);
      setForNichoCategoria(session.fornecedorData.nichoCategoria);
      setForEmail(session.fornecedorData.email);
      setForPhone(session.fornecedorData.telefone);
      setForAddress(session.fornecedorData.endereco);
      setForFotoPerfil(session.fornecedorData.fotoPerfil);
      setForCnpj(session.fornecedorData.cnpj);
      setForDescricao(session.fornecedorData.descricao || "");
    }
  }, [session]);

  // Modal / Interaction States
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showSupplierSOSModal, setShowSupplierSOSModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // --- Registration input states for Empreendedor ---
  const [empNomeCompleto, setEmpNomeCompleto] = useState("");
  const [empNomeEmpresa, setEmpNomeEmpresa] = useState("");
  const [empCpfCnpj, setEmpCpfCnpj] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [empTelefone, setEmpTelefone] = useState("");
  const [empEndereco, setEmpEndereco] = useState("");
  const [empFoto, setEmpFoto] = useState("CO");

  // --- Registration input states for Fornecedor ---
  const [forNomeEmpresa, setForNomeEmpresa] = useState("");
  const [forNichoCategoria, setForNichoCategoria] = useState("embalagens");
  const [forEmail, setForEmail] = useState("");
  const [forPassword, setForPassword] = useState("");
  const [forPhone, setForPhone] = useState("");
  const [forAddress, setForAddress] = useState("");
  const [forCnpj, setForCnpj] = useState("");
  const [forFotoPerfil, setForFotoPerfil] = useState("AT");
  const [forDescricao, setForDescricao] = useState("");

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Handle file logo upload for both user roles to Supabase Storage or base64 fallback
  const handleLogoUpload = async (file: File, userEmail: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${(userEmail || "user").replace(/[^a-zA-Z0-9]/g, "_")}.${fileExt}`;
    const filePath = `${fileName}`;

    if (isSupabaseConfigured && supabase) {
      try {
        // Try to upload to "logos" bucket in Supabase Storage
        const { data, error } = await supabase
          .storage
          .from('logos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (!error) {
          const { data: urlData } = supabase.storage.from('logos').getPublicUrl(filePath);
          return urlData.publicUrl;
        } else {
          console.warn("Could not upload to Supabase Storage, using fallback base64. Error:", error);
        }
      } catch (e) {
        console.warn("Supabase Storage upload failed. Using fallback base64.", e);
      }
    }

    // Default base64 fallback
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  };

  // New Supplier Creation States (by a logged-in Fornecedor)
  const [newSupName, setNewSupName] = useState("");
  const [newSupCategory, setNewSupCategory] = useState("embalagens");
  const [newSupDeliveryTime, setNewSupDeliveryTime] = useState("Imediato (Até 45 min)");
  const [newSupLocation, setNewSupLocation] = useState("");
  const [newSupDesc, setNewSupDesc] = useState("");
  const [newSupImmediate, setNewSupImmediate] = useState(true);
  const [newSupMinOrder, setNewSupMinOrder] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // New Product Setup States
  const [productPrice, setProductPrice] = useState("");
  const [productUnit, setProductUnit] = useState("Pacote");
  const [productImmediate, setProductImmediate] = useState(true);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

  // Map category icons helper
  const getCategoryIcon = (iconName: string, className: string = "w-4 h-4") => {
    switch (iconName) {
      case "Package": return <Package className={className} />;
      case "UtensilsCrossed": return <UtensilsCrossed className={className} />;
      case "Flame": return <Flame className={className} />;
      case "Truck": return <Truck className={className} />;
      case "Wrench": return <Wrench className={className} />;
      case "Printer": return <Printer className={className} />;
      default: return <Package className={className} />;
    }
  };

  // Find active supplier details
  const activeSupplier = useMemo(() => {
    return suppliers.find(s => s.id === activeSupplierId) || null;
  }, [suppliers, activeSupplierId]);

  // Handle live adding a review (with DB persistence)
  const handleAddReview = (supplierId: string, item: Omit<Review, "id" | "date">) => {
    const newReview: Review = {
      id: `rev-new-${Date.now()}`,
      author: item.author,
      company: item.company,
      rating: item.rating,
      comment: item.comment,
      date: new Date().toLocaleDateString("pt-BR")
    };

    setSuppliers(prevList => {
      const updatedList = prevList.map(sup => {
        if (sup.id === supplierId) {
          const newReviewList = [newReview, ...sup.reviews];
          const totalRating = newReviewList.reduce((acc, current) => acc + current.rating, 0);
          const newAvgRating = totalRating / newReviewList.length;

          const updatedSup = {
            ...sup,
            reviews: newReviewList,
            reviewsCount: newReviewList.length,
            rating: newAvgRating
          };
          dbRepo.saveSupplier(updatedSup).catch(err => console.error(err));
          return updatedSup;
        }
        return sup;
      });
      return updatedList;
    });
  };

  // Handle looking up an existing profile from Supabase/DB by email and password
  const handleEmailLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim() || !lookupPassword.trim()) {
      setLookupError("Por favor, digite o e-mail e a senha.");
      return;
    }
    setLookupError("");
    setIsLookingUp(true);
    try {
      const result = await dbRepo.getUserProfile(lookupEmail);
      if (result) {
        let enteredHashed = lookupPassword;
        if (lookupPassword && !lookupPassword.startsWith("sha256_")) {
          const hashed = await hashPassword(lookupPassword);
          enteredHashed = "sha256_" + hashed;
        }

        const isMatch = result.password.startsWith("sha256_")
          ? (result.password === enteredHashed)
          : (result.password === lookupPassword);

        if (result.password && !isMatch) {
          setLookupError("Senha incorreta para o e-mail informado. Tente novamente.");
          setIsLookingUp(false);
          return;
        }

        if (result.role === "empreendedor") {
          setSession({
            userType: "empreendedor",
            password: lookupPassword,
            empreendedorData: result.data,
            fornecedorData: null
          });
        } else {
          setSession({
            userType: "fornecedor",
            password: lookupPassword,
            empreendedorData: null,
            fornecedorData: result.data
          });
        }
        setShowSignUpModal(null);
        setLookupEmail("");
        setLookupPassword("");
        alert("Sucesso! Login realizado e perfil carregado do banco de dados.");
      } else {
        setLookupError("Nenhum perfil encontrado para este e-mail. Preencha os dados de cadastro abaixo para criar sua conta!");
      }
    } catch (err) {
      console.error(err);
      setLookupError("Erro de conexão ao buscar no servidor do banco de dados.");
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handle SOS emergency request submitted with DB persistence
  const handleSOSSubmit = (categoryId: string, itemDescription: string) => {
    // If the user triggers it, resolve appropriate visual details without blocking
    const companyName = session.userType === "empreendedor"
      ? (session.empreendedorData?.nomeEmpresa || "Seu Empreendimento")
      : session.userType === "fornecedor"
        ? (session.fornecedorData?.nomeEmpresa || "Fornecedor (Modo Emergência)")
        : "Seu Empreendimento";

    const addressStr = session.userType === "empreendedor"
      ? (session.empreendedorData?.endereco || "Pinheiros, São Paulo - SP")
      : session.userType === "fornecedor"
        ? (session.fornecedorData?.endereco || "Brás, São Paulo - SP")
        : "Pinheiros, São Paulo - SP";

    const categoryObj = CATEGORIES.find(c => c.id === categoryId);
    const categoryName = categoryObj ? categoryObj.name : "Geral";

    // Resolve lat/lng based on typed address
    let locCoords = { lat: -23.5621, lng: -46.6853 }; // default Pinheiros
    const lowerAddress = addressStr.toLowerCase();
    for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
      if (lowerAddress.includes(key)) {
        locCoords = coords;
        break;
      }
    }

    const newRequest = {
      id: `sos-user-${Date.now()}`,
      companyName,
      categoryName,
      categoryId,
      itemDescription,
      address: addressStr,
      // slight jitter to make sure multiple mock pins don't overlap exactly
      lat: locCoords.lat + (Math.random() - 0.5) * 0.008,
      lng: locCoords.lng + (Math.random() - 0.5) * 0.008,
      timestamp: "Agora mesmo"
    };

    setEmergencyRequests(prev => [newRequest, ...prev]);
    dbRepo.saveEmergencyRequest(newRequest).catch(err => console.error(err));

    // Automatically focus on this category and activate emergency shipping toggle!
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) return prev;
      return [...prev, categoryId];
    });
    setEmergencyOnly(true);
    setSearchQuery("");
  };

  // Add/Update product inside the logged-in supplier's catalog (insumos)
  const handleRegisterSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (session.userType !== "fornecedor") {
      setActionWarning({
        type: "anunciar",
        message: "Apenas usuários registrados com perfil de Fornecedor podem cadastrar novos insumos e anúncios no Hub. Por favor, crie uma conta como Fornecedor!"
      });
      return;
    }

    if (!newSupName.trim()) return;

    setSuppliers(prev => {
      const existingIdx = prev.findIndex(s => s.id === "sup-logged-fornecedor");
      
      const currentCompanyLogo = session.fornecedorData?.fotoPerfil || "CD";
      const currentCompanyName = session.fornecedorData?.nomeEmpresa || "Sua Distribuidora";
      const currentCompanyCategory = session.fornecedorData?.nichoCategoria || "embalagens";
      const currentCompanyAddress = session.fornecedorData?.endereco || "Brás, São Paulo - SP";
      const currentCompanyPhone = session.fornecedorData?.telefone || "(11) 98765-0102";
      const currentCompanyEmail = session.fornecedorData?.email || "vendas@distribuidora.com";
      const currentCompanyDesc = session.fornecedorData?.descricao || "Distribuidora parceira homologada para atendimento emergencial rápido.";

      let baseCatalog: CatalogItem[] = [];
      let baseReviews = [
        { id: "rev-logged", author: "Membro", company: "SupplYES", rating: 5, comment: "Perfil verificado em tempo real.", date: "Hoje" }
      ];

      if (existingIdx !== -1) {
        baseCatalog = [...prev[existingIdx].catalogItems];
        baseReviews = prev[existingIdx].reviews;
      }

      const formatProductPrice = (val: string): string => {
        const trimmed = val.trim();
        if (!trimmed) return "Sob Consulta";
        
        // If it already starts with R$ (case-insensitive)
        if (/^r\$/i.test(trimmed)) {
          return trimmed;
        }
        
        // If it starts with a digit/number, prepend R$
        if (/^\d/.test(trimmed)) {
          return `R$ ${trimmed}`;
        }
        
        return trimmed;
      };

      const newItem: CatalogItem = {
        name: newSupName,
        price: formatProductPrice(productPrice),
        unit: productUnit,
        immediateAvailable: productImmediate
      };

      if (editingProductIndex !== null) {
        // Edit existing product
        baseCatalog[editingProductIndex] = newItem;
      } else {
        // Add new product
        baseCatalog.push(newItem);
      }

      const updatedSupplier: Supplier = {
        id: "sup-logged-fornecedor",
        name: currentCompanyName,
        logo: currentCompanyLogo,
        category: currentCompanyCategory,
        location: currentCompanyAddress,
        rating: 5.0,
        reviewsCount: 1,
        fastDelivery: baseCatalog.some(item => item.immediateAvailable),
        deliveryTime: "Imediato (Até 45 min)",
        minOrderValue: Number(newSupMinOrder) || 100,
        whatsappUrl: `https://wa.me/${currentCompanyPhone.replace(/\D/g, '')}?text=Olá!%20Vi%20você%20cadastrado%20como%20fornecedor%20emergencial%20no%20Hub%20SupplYES.`,
        description: currentCompanyDesc,
        tags: ["Verificado", "Parceiro", currentCompanyCategory],
        verified: true,
        contactEmail: currentCompanyEmail,
        contactPhone: currentCompanyPhone,
        catalogItems: baseCatalog,
        reviews: baseReviews
      };

      dbRepo.saveSupplier(updatedSupplier).catch(err => console.error(err));

      const newList = prev.filter(s => s.id !== "sup-logged-fornecedor");
      return [updatedSupplier, ...newList];
    });

    setRegistrationSuccess(true);
    setNewSupName("");
    setProductPrice("");
    setProductUnit("Pacote");
    setProductImmediate(true);
    setNewSupDesc("");
    setNewSupMinOrder("");
    setEditingProductIndex(null);

    setTimeout(() => {
      setRegistrationSuccess(false);
      setShowRegisterModal(false);
    }, 2500);
  };

  // Start editing a product
  const handleStartEditProduct = (index: number, item: CatalogItem) => {
    setEditingProductIndex(index);
    setNewSupName(item.name);
    setProductPrice(item.price);
    setProductUnit(item.unit || "Pacote");
    setProductImmediate(item.immediateAvailable ?? true);
  };

  // Delete a product from logged-in supplier's catalog
  const handleDeleteProduct = (index: number) => {
    setSuppliers(prev => {
      const existingIdx = prev.findIndex(s => s.id === "sup-logged-fornecedor");
      if (existingIdx === -1) return prev;

      const myCompany = prev[existingIdx];
      const updatedCatalog = myCompany.catalogItems.filter((_, idx) => idx !== index);

      const updatedSupplier = {
        ...myCompany,
        catalogItems: updatedCatalog,
        fastDelivery: updatedCatalog.some(item => item.immediateAvailable)
      };

      dbRepo.saveSupplier(updatedSupplier).catch(err => console.error(err));

      const newList = [...prev];
      newList[existingIdx] = updatedSupplier;
      return newList;
    });
    alert("Insumo removido com sucesso!");
  };

  // Cancel editing product
  const handleCancelEditProduct = () => {
    setEditingProductIndex(null);
    setNewSupName("");
    setProductPrice("");
    setProductUnit("Pacote");
    setProductImmediate(true);
  };

  // Filter supplier Logic
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(sup => {
      // 1. Text Search matching name, description or tags
      const matchesText = searchQuery.trim() === "" || 
        sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sup.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Multiple Category matching
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(sup.category);

      // 3. Emergency shipping option
      const matchesEmergency = !emergencyOnly || sup.fastDelivery;

      // 4. Must have at least one product in catalog
      const hasProducts = sup.catalogItems && sup.catalogItems.length > 0;

      return matchesText && matchesCategory && matchesEmergency && hasProducts;
    });
  }, [suppliers, searchQuery, selectedCategories, emergencyOnly]);

  // Currently viewed subset based on "Ver Mais"
  const visibleSuppliers = useMemo(() => {
    return filteredSuppliers.slice(0, visibleCount);
  }, [filteredSuppliers, visibleCount]);

  // Clean filters checker to show pills
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (emergencyOnly) count++;
    return count;
  }, [searchQuery, selectedCategories, emergencyOnly]);

  // Clear all filters action
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setEmergencyOnly(false);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col justify-between">
      
      {/* 1. TOP NAV CAPSULE - Floating Island with rounded border (Apple iOS style) */}
      <header className="sticky top-4 z-40 max-w-7xl w-full mx-auto px-4">
        <div className="ios-island px-6 py-4 rounded-[28px] flex items-center justify-between border border-neutral-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all">
          
          {/* Logo element from wireframe — Placeholder for custom logo */}
          <div 
            onClick={() => setActiveRoute("hub")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-98 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/50 flex items-center justify-center overflow-hidden shrink-0" title="Placeholder de Logo - Substitua por <img>">
              {/* Para inserir sua própria imagem de logo, use: <img src="/caminho_da_imagem.png" alt="Logo SupplYES" className="w-full h-full object-contain" /> */}
              <span className="text-[10px] font-black tracking-tight text-neutral-400 font-mono">LOGO</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-neutral-950 text-sm tracking-tight leading-none uppercase">SupplYES</span>
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider leading-none mt-1">HUB DE CONEXÃO</span>
            </div>
          </div>

          {/* Page Name element from wireframe */}
          <div className="hidden md:flex items-center gap-2 bg-neutral-100/70 p-1 px-3 rounded-full border border-neutral-200/20 shadow-inner">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-neutral-900 text-xs tracking-tight uppercase">
              {activeRoute === "hub" && "HUB DE FORNECEDORES DE EMERGÊNCIA"}
              {activeRoute === "perfil" && "CONFIGURAÇÃO DE PERFIL"}
              {activeRoute === "planos" && "PLANOS DE DESTAQUE"}
              {activeRoute === "produtos" && "PRODUTOS E CATÁLOGO"}
              {activeRoute === "sos_dashboard" && "SOS DE EMERGÊNCIA & MAPAS"}
            </span>
          </div>

          {/* Profile & Menu elements from wireframe */}
          <div className="flex items-center gap-2">
            {session.userType === null ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowSignUpModal("empreendedor")}
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-extrabold text-[10px] sm:text-xs py-2.5 px-3 sm:px-4 rounded-full border-none transition-all active:scale-95 cursor-pointer uppercase tracking-tight shadow-sm shadow-brand-red/10"
                >
                  Seja um Empreendedor
                </button>
                <button 
                  onClick={() => setShowSignUpModal("fornecedor")}
                  className="bg-brand-charcoal hover:bg-brand-charcoal/90 text-white font-extrabold text-[10px] sm:text-xs py-2.5 px-3 sm:px-4 rounded-full border-none transition-all active:scale-95 cursor-pointer uppercase tracking-tight"
                >
                  Seja um Fornecedor
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {/* 1. Anunciar button (only works smoothly for Fornecedores, blocks Empreendedores with clean drawer notice) */}
                <button 
                  id="cta-register-supplier"
                  onClick={() => {
                    if (session.userType !== "fornecedor") {
                      setActionWarning({
                        type: "anunciar",
                        message: "Sua conta atual está registrada como Empreendedor. Apenas contas de Fornecedores podem cadastrar novos catálogos no Hub. Crie seu perfil de Fornecedor no menu lateral!"
                      });
                    } else {
                      setActiveRoute("produtos");
                    }
                  }}
                  className="bg-brand-charcoal hover:bg-brand-charcoal/90 text-white font-bold text-xs p-2.5 px-4 rounded-full border-none pointer transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Anunciar</span>
                </button>

                 {/* 2. SOS Button (Inverted order: first SOS then Profile Icon) - Hidden completely for supplier accounts */}
                 {session.userType !== "fornecedor" && (
                   <button 
                     id="menu-btn"
                     onClick={() => {
                       setShowSOSModal(true);
                     }}
                     className="w-10 h-10 rounded-full bg-brand-red/5 hover:bg-brand-red/10 text-brand-red font-bold text-xs flex items-center justify-center border border-brand-red/20 pointer active:scale-95 transition-all relative cursor-pointer"
                     title="Disparar Emergência SOS"
                   >
                     <span className="uppercase text-[11px] font-extrabold tracking-tighter">SOS</span>
                     <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full border-2 border-white animate-ping" />
                   </button>
                 )}

                {/* 3. Perfil Icon Button (Replaces raw PERFIL text, opens Drawer) */}
                <button 
                  id="perfil-btn"
                  onClick={() => {
                    setActiveTabSidebar("perfil");
                    setShowSidebar(true);
                  }}
                  className="w-10 h-10 rounded-full bg-neutral-100 text-brand-charcoal hover:bg-neutral-200/80 flex items-center justify-center border border-neutral-200/40 pointer active:scale-95 transition-all relative overflow-hidden cursor-pointer"
                  title="Ver Painel do Usuário"
                >
                  {session.userType === "empreendedor" ? (
                    <User className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <Package className="w-4 h-4 text-neutral-600" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Header Space / Dynamic Island Broadcaster */}
      <main className="max-w-7xl w-full mx-auto px-4 pt-10 pb-20 space-y-8 flex-grow">
        
        {activeRoute === "hub" ? (
          <>
            {/* SUPPLIER ACTIVE ALERT BANNER REGION */}
            {session.userType === "fornecedor" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-rose-50 border border-rose-200/60 p-5 rounded-[28px] flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center animate-pulse">
                    <span className="text-xl">🚨</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-950 text-sm tracking-tight leading-none">Clientes precisam de insumos urgentes agora!</h4>
                    <p className="text-rose-700 text-[11px] font-semibold mt-1">
                      Há <span className="font-black text-brand-red underline">{emergencyRequests.length} alertas SOS pendentes</span> em bairros vizinhos. Visualize os detalhes e realize a conexão rápida!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveRoute("sos_dashboard")}
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-extrabold text-xs py-3 px-6 rounded-full border-none transition-all active:scale-95 cursor-pointer uppercase tracking-wider shadow-md shadow-brand-red/10 flex items-center gap-1.5 shrink-0"
                >
                  <span>Abrir Central SOS & Mapa</span>
                  <Map className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* Dynamic Island: Emergency Callout Center */}
        <section className="w-full">
          <div className="p-8 pb-10 rounded-[36px] bg-neutral-50/80 border border-neutral-100 relative overflow-hidden flex flex-col justify-between items-start md:flex-row md:items-center gap-6 shadow-[0_12px_45px_rgba(0,0,0,0.02)]">
            
            {/* Visual background decorative element */}
            <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-bl from-brand-red/[0.05] to-brand-charcoal/[0.03] rounded-l-full pointer-events-none" />

            <div className="space-y-3 max-w-xl z-10 min-h-[170px] flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAdIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2.5"
                >
                  <div className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/20 text-brand-red px-3 py-1 rounded-[14px]">
                    <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
                    <span className="text-xs font-extrabold uppercase tracking-wider">{AD_CAMPAIGNS[activeAdIndex].tag}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 leading-tight">
                    {AD_CAMPAIGNS[activeAdIndex].title}
                  </h1>
                  <p className="text-neutral-600 font-medium text-xs leading-relaxed max-w-lg">
                    {AD_CAMPAIGNS[activeAdIndex].descLine1}
                  </p>
                  <p className="text-neutral-450 text-[11px] leading-relaxed max-w-lg">
                    {AD_CAMPAIGNS[activeAdIndex].descLine2}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Clickable circular pager bullets for navigating the PPC campaigns */}
              <div className="flex items-center gap-2.5 pt-4">
                {AD_CAMPAIGNS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveAdIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all border-none cursor-pointer ${
                      activeAdIndex === idx ? "bg-brand-red w-5.5" : "bg-neutral-300 hover:bg-neutral-400"
                    }`}
                    title={`Anúncio ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 z-10 self-end md:self-center">
              {session.userType !== "fornecedor" && (
                <button
                  id="emergency-sos-action-btn"
                  onClick={() => setShowSOSModal(true)}
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-bold p-4 px-7 rounded-[22px] shadow-lg shadow-brand-red/10 active:scale-95 transition-all text-xs border-none uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Disparar Alerta SOS</span>
                </button>
              )}

              <button
                id="how-it-works-btn"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategories([]);
                  setEmergencyOnly(true);
                }}
                className={`p-4 px-6 rounded-[22px] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  emergencyOnly 
                    ? "bg-brand-red/10 text-brand-red border-brand-red/20" 
                    : "bg-white hover:bg-neutral-50 text-brand-charcoal border border-neutral-200/60"
                }`}
              >
                <Clock className="w-4 h-4 text-brand-red" />
                <span>Ver Apenas Imediatos</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. FILTER CONTROLS HUB - Left/Right Wireframe alignment */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
            
            {/* Written Search & Filter Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-[28px] border border-neutral-100 shadow-[0_12px_24px_rgba(0,0,0,0.01)]">
              
              {/* Search bar matching wireframe item */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Pesquisar fornecedores, itens ou etiquetas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-100 hover:bg-neutral-200/50 focus:bg-white text-xs font-medium pl-11 pr-4 py-3.5 rounded-full border border-neutral-200/20 focus:border-neutral-300 outline-none focus:ring-1 focus:ring-neutral-200/50 transition-all text-neutral-800 text-ellipsis"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-3.5 w-5 h-5 rounded-full bg-neutral-200/60 flex items-center justify-center text-neutral-500 hover:text-neutral-900 border-none pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Instant Emergency Toggle integrated directly inside filters bar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="flex items-center gap-2 bg-neutral-50 p-2 px-3.5 rounded-full border border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-600">Filtro de Despacho:</span>
                  <button 
                    onClick={() => setEmergencyOnly(!emergencyOnly)}
                    className={`p-1 px-3 rounded-full text-[11px] font-bold transition-all uppercase flex items-center gap-1.5 cursor-pointer ${
                      emergencyOnly 
                        ? "bg-brand-red text-white shadow-sm" 
                        : "bg-neutral-200/80 text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    {emergencyOnly ? "SÓ IMEDIATOS (SOS) Ativo" : "Todos Fornecedores"}
                  </button>
                </div>

                <button 
                  onClick={handleClearFilters}
                  disabled={activeFiltersCount === 0}
                  className="p-3 text-xs font-semibold text-neutral-400 hover:text-brand-red disabled:opacity-45 disabled:hover:text-neutral-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Limpar Busca</span>
                </button>
              </div>
            </div>

            {/* Scrollable Category Bubbles: Apple inspired pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategories([])}
                className={`whitespace-nowrap py-3 px-6 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategories.length === 0 
                    ? "bg-brand-charcoal text-white shadow-md shadow-brand-charcoal/10" 
                    : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                }`}
              >
                Todas Categorias
              </button>

              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategories(prev => {
                        if (prev.includes(cat.id)) {
                          return prev.filter(id => id !== cat.id);
                        } else {
                          return [...prev, cat.id];
                        }
                      });
                    }}
                    className={`whitespace-nowrap py-3 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected 
                        ? "bg-brand-charcoal text-white shadow-md shadow-brand-charcoal/10" 
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {getCategoryIcon(cat.iconName, "w-3.5 h-3.5")}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* "FILTROS SELECIONADOS COM OPCÃO DE APAGAR" element matching wireframe */}
            {activeFiltersCount > 0 && (
              <div className="p-4 bg-neutral-50 rounded-[22px] border border-neutral-100 flex items-center gap-3 flex-wrap">
                <span className="text-xs text-neutral-400 font-bold tracking-tight uppercase">Filtros Selecionados:</span>
                
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((catId) => {
                    const catInfo = CATEGORIES.find(c => c.id === catId);
                    if (!catInfo) return null;
                    return (
                      <span key={catId} className="bg-white border border-neutral-200/50 text-neutral-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        Categoria: <b className="text-neutral-950 font-semibold">{catInfo.name}</b>
                        <button 
                          onClick={() => setSelectedCategories(prev => prev.filter(id => id !== catId))}
                          className="text-neutral-400 hover:text-neutral-900 focus:outline-none ml-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    );
                  })}

                  {searchQuery && (
                    <span className="bg-white border border-neutral-200/50 text-neutral-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      Termo: <b className="text-neutral-950 font-semibold">"{searchQuery}"</b>
                      <button 
                        onClick={() => setSearchQuery("")}
                        className="text-neutral-400 hover:text-neutral-900 focus:outline-none ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  {emergencyOnly && (
                    <span className="bg-brand-red/5 border border-brand-red/10 text-brand-red text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                      <Clock className="w-3.5 h-3.5 text-brand-red shrink-0" />
                      <span>Despacho Imediato Emergencial</span>
                      <button 
                        onClick={() => setEmergencyOnly(false)}
                        className="text-brand-red/75 hover:text-brand-red focus:outline-none ml-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}

                  <button 
                    onClick={handleClearFilters}
                    className="text-xs text-brand-red bg-brand-red/5 hover:bg-brand-red/10 px-3 py-1 rounded-full font-bold transition-all border-none cursor-pointer"
                  >
                    Apagar Todos
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. SUPPLIER GRID SECTION - Fornecedores wireframe grids */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-extrabold text-neutral-400 uppercase tracking-wider">
              {isLoading 
                ? "Buscando fornecedores homologados..." 
                : filteredSuppliers.length === 0 
                  ? "Nenhum fornecedor encontrado" 
                  : `Fornecedores Disponíveis (${filteredSuppliers.length})`
              }
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <div 
                  key={index} 
                  className="relative p-6 bg-white min-h-[280px] rounded-[32px] border border-neutral-100 flex flex-col justify-between shadow-[0_12px_36px_rgba(0,0,0,0.015)] animate-pulse"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      {/* Logo Frame Shimmer */}
                      <div className="w-14 h-14 bg-neutral-100 rounded-2xl border border-neutral-200/30 shrink-0" />
                      <div className="space-y-2.5 flex-grow mt-1">
                        <div className="h-3.5 bg-neutral-200 rounded-md w-2/3" />
                        <div className="h-2.5 bg-neutral-100 rounded-md w-1/2" />
                      </div>
                    </div>
                    {/* Short custom description shimmer */}
                    <div className="space-y-2 pt-2">
                      <div className="h-3 bg-neutral-100/90 rounded-md w-full" />
                      <div className="h-3 bg-neutral-100/60 rounded-md w-11/12" />
                    </div>
                  </div>
                  {/* Footer details shimmer */}
                  <div className="pt-4 border-t border-neutral-50/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-neutral-100 rounded-md w-20" />
                      <div className="h-3 bg-neutral-150 rounded-md w-8" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-3 bg-neutral-100/70 rounded-md w-24" />
                      <div className="h-3 bg-neutral-200 rounded-md w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-16 rounded-[34px] bg-neutral-50/30 border border-neutral-100 text-center space-y-4 max-w-lg mx-auto"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center text-xl text-neutral-400 mx-auto">
                🔍
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-neutral-800 text-sm">Nenhum Fornecedor nos Filtros</h3>
                <p className="text-xs text-neutral-500">Experimente limpar a pesquisa escrita ou mudar o filtro "Entrega Imediata" para ver todas as opções disponíveis em São Paulo.</p>
              </div>
              <button 
                onClick={handleClearFilters}
                className="p-2.5 px-5 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-neutral-800 border-none cursor-pointer"
              >
                Resetar Filtros
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {visibleSuppliers.map((supplier) => (
                  <SupplierCard 
                    key={supplier.id}
                    supplier={supplier}
                    onClick={() => setActiveSupplierId(supplier.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* 4. "VER MAIS" (Load more) matching bottom selector in wireframe */}
          {!isLoading && filteredSuppliers.length > visibleCount && (
            <div className="pt-6 flex justify-center">
              <motion.button
                id="ver-mais-btn"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setVisibleCount(prev => prev + 3)}
                className="px-8 py-4 bg-neutral-50 hover:bg-neutral-100 active:scale-95 text-neutral-800 font-extrabold text-xs rounded-full border border-neutral-200/50 shadow-md shadow-neutral-200/5 pointer transition-all uppercase tracking-wide flex items-center gap-2 cursor-pointer"
              >
                <span>VER MAIS FORNECEDORES</span>
                <span className="text-[10px] bg-neutral-200 text-neutral-700 px-2.5 py-0.5 rounded-full font-bold">
                  +{filteredSuppliers.length - visibleCount}
                </span>
              </motion.button>
            </div>
          )}
        </section>

        {/* 5. USER BENEFITS & FAQ FLOATING PANEL - Styled as an Apple widget island */}
        <section className="pt-10">
          <div className="bg-neutral-50/50 p-8 rounded-[38px] border border-neutral-100/80 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <span className="text-xl">🛡️</span>
              <h4 className="font-bold text-neutral-900 text-sm">Insumos Homologados</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Nossos fornecedores passam por uma verificação ágil antes de receber o selo azul de verificação para garantir embalagens e alimentos em conformidade técnica.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xl">⚠️</span>
              <h4 className="font-bold text-neutral-900 text-sm">Gatilho de Emergência</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Use o botão SOS para filtrar serviços de motoboy express, gás industrial ou caixas que despacham na mesma hora.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xl">💬</span>
              <h4 className="font-bold text-neutral-900 text-sm">Planos Acessíveis</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Planos flexíveis de assinatura para os fornecedores anunciarem e listarem seus produtos diretamente no site, sem comissões extras.
              </p>
            </div>
          </div>
        </section>

          </>
        ) : (
          /* Sub-Pages based on activeRoute with full-page fluid immersive layouts */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Route 2: NEW EDIT PROFILE INTERACTIVE PAGE */}
            {activeRoute === "perfil" && (
              <div className="space-y-8">
                {/* Breadcrumb navigation */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveRoute("hub")}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                  >
                    ← Voltar para o Hub de Fornecedores
                  </button>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    Configurações de Conta ({session.userType === "empreendedor" ? "Empreendedor" : "Fornecedor"})
                  </span>
                </div>

                {/* Success toast alerts */}
                {profileSaveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-[22px] flex items-center gap-3 text-emerald-800 animate-slide-up"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold">Alterações gravadas com sucesso!</p>
                      <p className="font-medium opacity-90">Sua ficha cadastral foi instantaneamente atualizada em tempo real no banco de dados.</p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Column 1: Live HUD preview cards */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-neutral-50 p-6 rounded-[32px] border border-neutral-200/50 space-y-5 text-center shadow-xs">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Ficha do Hub Ativo</span>
                      <div className="w-20 h-20 bg-white rounded-full border border-neutral-200 flex items-center justify-center text-4xl mx-auto shadow-inner">
                        {session.userType === "empreendedor" ? (empFoto ? empFoto.substring(0, 2) : "👨‍💼") : (forFotoPerfil ? forFotoPerfil.substring(0, 2) : "🏢")}
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-950 text-base sm:text-lg tracking-tight">
                          {session.userType === "empreendedor" ? empNomeEmpresa || "Sua Empresa" : forNomeEmpresa || "Sua Distribuidora"}
                        </h4>
                        <p className="text-[10px] bg-brand-charcoal text-white px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-block mt-2">
                          {session.userType === "empreendedor" ? "🔐 Empreendedor" : `🚚 Fornecedor: ${forNichoCategoria.toUpperCase()}`}
                        </p>
                      </div>
                      
                      <div className="pt-4 border-t border-neutral-200 text-left text-xs text-neutral-505 space-y-2.5">
                        <p><b>Representante:</b> {session.userType === "empreendedor" ? empNomeCompleto || "Guilherme Santos" : "Diretor Comercial"}</p>
                        <p className="inline-block truncate max-w-full"><b>E-mail:</b> {session.userType === "empreendedor" ? empEmail || "contato@empresa.com" : forEmail || "vendas@distribuidora.com"}</p>
                        <p><b>WhatsApp:</b> {session.userType === "empreendedor" ? empTelefone || "(11) 99999-8888" : forPhone || "(11) 98765-0102"}</p>
                        <p><b>Documento:</b> {session.userType === "empreendedor" ? empCpfCnpj || "123.456.789-00" : forCnpj || "55.444.333/0001-20"}</p>
                        <p className="text-neutral-700 leading-normal border-t border-neutral-100 pt-2.5 mt-2">
                          <b>📍 Endereço Cadastrado:</b><br />
                          <span className="text-neutral-500 font-medium">{session.userType === "empreendedor" ? empEndereco || "Pinheiros, São Paulo - SP" : forAddress || "Brás, São Paulo - SP"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Editable Form Page */}
                  <div className="lg:col-span-8 bg-neutral-50/50 p-6 sm:p-8 rounded-[32px] border border-neutral-100">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-extrabold text-neutral-950 text-lg tracking-tight">Informações e Endereço Completo</h3>
                        <p className="text-xs text-neutral-400 font-medium">Insira a logo fictícia ou real, endereço completo e dados governamentais comercializados no Hub.</p>
                      </div>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (session.userType === "empreendedor") {
                            setSession(prev => ({
                              ...prev,
                              empreendedorData: {
                                nomeCompleto: empNomeCompleto,
                                nomeEmpresa: empNomeEmpresa,
                                cpfCnpj: empCpfCnpj,
                                email: empEmail,
                                telefone: empTelefone,
                                endereco: empEndereco,
                                foto: empFoto
                              }
                            }));
                          } else {
                            setSession(prev => ({
                              ...prev,
                              fornecedorData: {
                                nomeEmpresa: forNomeEmpresa,
                                nichoCategoria: forNichoCategoria,
                                email: forEmail,
                                telefone: forPhone,
                                endereco: forAddress,
                                fotoPerfil: forFotoPerfil,
                                cnpj: forCnpj,
                                descricao: forDescricao
                              }
                            }));

                            // Sync supplier card to suppliers list
                            setSuppliers(prev => {
                              const existingIdx = prev.findIndex(s => s.id === "sup-logged-fornecedor");
                              const updatedSupplier: Supplier = {
                                id: "sup-logged-fornecedor",
                                name: forNomeEmpresa,
                                logo: forFotoPerfil,
                                category: forNichoCategoria,
                                location: forAddress,
                                rating: 5.0,
                                reviewsCount: 1,
                                fastDelivery: existingIdx !== -1 ? prev[existingIdx].fastDelivery : true,
                                deliveryTime: "Imediato (Até 45 min)",
                                minOrderValue: 100,
                                whatsappUrl: `https://wa.me/${forPhone.replace(/\D/g, '')}?text=Olá!%20Vi%20você%20cadastrado%20como%20fornecedor%20emergencial%20no%20Hub%20SupplYES.`,
                                description: forDescricao || "Distribuidora oficial verificado.",
                                tags: ["Verificado", "Parceiro", forNichoCategoria],
                                verified: true,
                                contactEmail: forEmail,
                                contactPhone: forPhone,
                                catalogItems: existingIdx !== -1 ? prev[existingIdx].catalogItems : [],
                                reviews: existingIdx !== -1 ? prev[existingIdx].reviews : [
                                  { id: "rev-logged", author: "Membro", company: "SupplYES", rating: 5, comment: "Perfil verificado em tempo real.", date: "Hoje" }
                                ]
                              };

                              if (existingIdx !== -1) {
                                const newList = [...prev];
                                newList[existingIdx] = updatedSupplier;
                                return newList;
                              } else {
                                return [updatedSupplier, ...prev];
                              }
                            });
                          }
                          setProfileSaveSuccess(true);
                          setTimeout(() => setProfileSaveSuccess(false), 2500);
                        }}
                        className="space-y-4 text-xs font-medium"
                      >
                        {session.userType === "empreendedor" ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Nome do Representante</label>
                                <input 
                                  type="text"
                                  required
                                  value={empNomeCompleto}
                                  onChange={(e) => setEmpNomeCompleto(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 focus:border-neutral-400"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Nome do Empreendimento</label>
                                <input 
                                  type="text"
                                  required
                                  value={empNomeEmpresa}
                                  onChange={(e) => setEmpNomeEmpresa(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 focus:border-neutral-400"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">CPF ou CNPJ comercial</label>
                                <input 
                                  type="text"
                                  required
                                  value={empCpfCnpj}
                                  onChange={(e) => setEmpCpfCnpj(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans flex items-center justify-between">
                                  <span>Logo da Empresa (Upload)</span>
                                  {empFoto && (empFoto.startsWith("http") || empFoto.startsWith("data:")) && (
                                    <span className="text-[8px] text-emerald-500 font-bold normal-case font-mono">Carregado ✓</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                                    {empFoto ? (
                                      empFoto.startsWith("http") || empFoto.startsWith("data:") ? (
                                        <img src={empFoto} alt="Logo" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-xs font-black text-neutral-600 font-mono tracking-wider">{empFoto.substring(0, 3)}</span>
                                      )
                                    ) : (
                                      <span className="text-zinc-400 text-[10px] font-bold">Sem Logo</span>
                                    )}
                                  </div>
                                  <div className="relative flex-grow">
                                    <input 
                                      type="file"
                                      accept="image/*"
                                      id="emp-logo-file"
                                      className="sr-only"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setIsUploadingLogo(true);
                                          try {
                                            const url = await handleLogoUpload(file, empEmail);
                                            setEmpFoto(url);
                                          } catch (err) {
                                            console.error(err);
                                            alert("Falha ao ler o arquivo.");
                                          } finally {
                                            setIsUploadingLogo(false);
                                          }
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor="emp-logo-file"
                                      className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer text-[11px] font-bold text-neutral-750 transition-all shadow-xs active:scale-97"
                                    >
                                      {isUploadingLogo ? (
                                        <svg className="animate-spin h-3.5 w-3.5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : (
                                        <span>📁 Enviar Logomarca</span>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">E-mail de Contato</label>
                                <input 
                                  type="email"
                                  required
                                  value={empEmail}
                                  onChange={(e) => setEmpEmail(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">WhatsApp Comercial</label>
                                <input 
                                  type="text"
                                  required
                                  value={empTelefone}
                                  onChange={(e) => setEmpTelefone(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Endereço de Entrega Completo</label>
                              <input 
                                type="text"
                                required
                                value={empEndereco}
                                onChange={(e) => setEmpEndereco(e.target.value)}
                                className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                              />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Nome do Fornecedor / Distribuidora</label>
                                  <input 
                                    type="text"
                                    required
                                    value={forNomeEmpresa}
                                    onChange={(e) => setForNomeEmpresa(e.target.value)}
                                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 focus:border-neutral-400"
                                  />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Nicho / Categoria Principal</label>
                                <select 
                                  value={forNichoCategoria}
                                  onChange={(e) => setForNichoCategoria(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 focus:border-neutral-400 font-sans"
                                >
                                  {CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">CNPJ da Distribuidora</label>
                                <input 
                                  type="text"
                                  required
                                  value={forCnpj}
                                  onChange={(e) => setForCnpj(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans flex items-center justify-between">
                                  <span>Logo da Distribuidora (Upload)</span>
                                  {forFotoPerfil && (forFotoPerfil.startsWith("http") || forFotoPerfil.startsWith("data:")) && (
                                    <span className="text-[8px] text-emerald-500 font-bold normal-case font-mono">Carregado ✓</span>
                                  )}
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                                    {forFotoPerfil ? (
                                      forFotoPerfil.startsWith("http") || forFotoPerfil.startsWith("data:") ? (
                                        <img src={forFotoPerfil} alt="Logo" className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-xs font-black text-neutral-600 font-mono tracking-wider">{forFotoPerfil.substring(0, 3)}</span>
                                      )
                                    ) : (
                                      <span className="text-zinc-400 text-[10px] font-bold">Sem Logo</span>
                                    )}
                                  </div>
                                  <div className="relative flex-grow">
                                    <input 
                                      type="file"
                                      accept="image/*"
                                      id="for-logo-file"
                                      className="sr-only"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          setIsUploadingLogo(true);
                                          try {
                                            const url = await handleLogoUpload(file, forEmail);
                                            setForFotoPerfil(url);
                                          } catch (err) {
                                            console.error(err);
                                            alert("Falha ao ler o arquivo.");
                                          } finally {
                                            setIsUploadingLogo(false);
                                          }
                                        }
                                      }}
                                    />
                                    <label 
                                      htmlFor="for-logo-file"
                                      className="flex items-center justify-center gap-1.5 p-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-xl cursor-pointer text-[11px] font-bold text-neutral-750 transition-all shadow-xs active:scale-97"
                                    >
                                      {isUploadingLogo ? (
                                        <svg className="animate-spin h-3.5 w-3.5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                      ) : (
                                        <span>📁 Enviar Logomarca</span>
                                      )}
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">E-mail Comercial de Vendas</label>
                                <input 
                                  type="email"
                                  required
                                  value={forEmail}
                                  onChange={(e) => setForEmail(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Contato WhatsApp de Pedidos</label>
                                <input 
                                  type="text"
                                  required
                                  value={forPhone}
                                  onChange={(e) => setForPhone(e.target.value)}
                                  className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Endereço Completo do CD / Galpão</label>
                              <input 
                                type="text"
                                required
                                value={forAddress}
                                onChange={(e) => setForAddress(e.target.value)}
                                className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 animate-fade-in"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block font-sans">Descrição Geral da Empresa (Aparece no Hub)</label>
                              <textarea 
                                rows={3}
                                required
                                value={forDescricao}
                                onChange={(e) => setForDescricao(e.target.value)}
                                placeholder="Descreva os tipos de insumo, marcas e principais diferenciais de logística ou facilidade de sua distribuidora..."
                                className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 focus:border-neutral-400 resize-none font-sans"
                              />
                            </div>
                          </>
                        )}

                        <button 
                          type="submit"
                          className="w-full py-4 bg-brand-charcoal hover:bg-neutral-850 text-white font-extrabold rounded-full text-xs transition-transform active:scale-98 uppercase tracking-wider border-none cursor-pointer text-center"
                        >
                          Salvar Todas as Alterações de Perfil
                        </button>
                      </form>


                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Route 3: PLANS 3-OPTIONS SCREEN */}
            {activeRoute === "planos" && (
              <div className="space-y-8 animate-fade-in">
                {/* Breadcrumb section */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveRoute("hub")}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                  >
                    ← Voltar para o Hub de Fornecedores
                  </button>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    Exclusivo para Fabricantes e Distribuidores
                  </span>
                </div>

                <div className="text-center space-y-2 max-w-2xl mx-auto py-4">
                  <h2 className="text-2.5xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">Planos de Destaque & Posicionamento</h2>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium">
                    Sua distribuidora com prioridade em momentos de ruptura emergencial. Seja o primeiro fornecedor sugerido no Alarme SOS!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                  {/* Plan 1: Bronze */}
                  <div className={`p-8 bg-neutral-50/70 rounded-[32px] border relative flex flex-col justify-between h-full transition-all ${
                    activePlan === "bronze" ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-white" : "border-neutral-200/60 shadow-xs"
                  }`}>
                    <div className="space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-neutral-950 text-sm">Plano Bronze</h4>
                          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mt-1">Destaque Inicial Regional</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[28px] font-black text-neutral-950 font-sans">R$ 29</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider"> / mês</span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-neutral-500 font-medium list-none p-0">
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-medium">Destaque no feed de busca de insumos</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-medium">Filtro de entrega express ativo</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-medium">Contato ilimitado via WhatsApp comercial</span></li>
                        <li className="flex items-center gap-2 text-neutral-300"><X className="w-3.5 h-3.5 text-neutral-300 shrink-0" /> <span>Prioridade máxima no Alerta SOS em crises</span></li>
                        <li className="flex items-center gap-2 text-neutral-300"><X className="w-3.5 h-3.5 text-neutral-300 shrink-0" /> <span>Suporte prioritário da equipe SupplYES</span></li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setActivePlan("bronze");
                        alert("Sucesso! Você selecionou o Plano Bronze para sua distribuidora.");
                      }}
                      className={`w-full mt-8 py-3 rounded-full text-xs font-bold transition-all uppercase tracking-wide border-none cursor-pointer text-center ${
                        activePlan === "bronze" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-neutral-200 hover:bg-neutral-300 text-neutral-800"
                      }`}
                    >
                      {activePlan === "bronze" ? "✓ Seu Plano Ativo" : "Selecionar Bronze"}
                    </button>
                  </div>

                  {/* Plan 2: Prata */}
                  <div className={`p-8 rounded-[32px] border relative flex flex-col justify-between h-full transition-all ${
                    activePlan === "prata" ? "border-brand-red ring-2 ring-brand-red/10 bg-white" : "border-neutral-200/60 bg-white"
                  } shadow-xl md:-translate-y-4`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-red text-white py-1 px-4 rounded-full text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap">
                      Mais Popular
                    </div>
                    <div className="space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-neutral-950 text-sm">Plano Prata</h4>
                          <p className="text-[10px] text-brand-red font-bold uppercase tracking-wider mt-1">SOS Prioritário Recomendado</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[28px] font-black text-neutral-950 font-sans">R$ 59</span>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider"> / mês</span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-neutral-500 font-medium list-none p-0">
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-semibold">Tudo incluído no Plano Bronze</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-medium">Destaque prioritário de relevância na busca</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-semibold">Selo de Homologação SOS no card geral</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span className="text-neutral-800 font-medium">Disparo de push para até 20 padarias no Alerta</span></li>
                        <li className="flex items-center gap-2 text-neutral-300"><X className="w-3.5 h-3.5 text-neutral-300 shrink-0" /> <span className="text-neutral-500">Suporte gerencial e monitoramento de ruptura</span></li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setActivePlan("prata");
                        alert("Sucesso! Você escolheu o Plano Prata. Sua distribuidora agora tem prioridade nos alertas emergenciários.");
                      }}
                      className={`w-full mt-8 py-3 rounded-full text-xs font-bold transition-all uppercase tracking-wide border-none cursor-pointer text-center ${
                        activePlan === "prata" ? "bg-brand-red text-white hover:bg-brand-red/90" : "bg-neutral-800 hover:bg-neutral-700 text-white"
                      }`}
                    >
                      {activePlan === "prata" ? "✓ Seu Plano Ativo" : "Selecionar Prata"}
                    </button>
                  </div>

                  {/* Plan 3: Ouro */}
                  <div className={`p-8 bg-neutral-950 text-white rounded-[32px] border relative flex flex-col justify-between h-full transition-all ${
                    activePlan === "ouro" ? "border-amber-400 ring-2 ring-amber-400/20 shadow-xl" : "border-transparent"
                  }`}>
                    <div className="space-y-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-white text-sm">Plano Ouro</h4>
                          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mt-1">Soberano Total de Rupturas</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-[28px] font-black text-white font-sans">R$ 99</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider"> / mês</span>
                      </div>
                      <ul className="space-y-2.5 text-xs text-zinc-400 font-medium list-none p-0">
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="text-zinc-100">Posicionamento Nº 1 Absoluto no Hub</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="text-zinc-100">Disparo ilimitado para toda a carteira de alerta</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="text-zinc-100">Selo Exclusivo de Verificação Gold</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="text-zinc-100">Suporte técnico dedicado via Gerente de Contas</span></li>
                        <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-amber-400 shrink-0" /> <span className="text-zinc-100">Relatório semanal de carências de estoque da rede</span></li>
                      </ul>
                    </div>
                    <button
                      onClick={() => {
                        setActivePlan("ouro");
                        alert("Parabéns! Você se tornou um membro parceiro Ouro e terá visibilidade absoluta no topo do Hub.");
                      }}
                      className={`w-full mt-8 py-3 rounded-full text-xs font-bold transition-all uppercase tracking-wide border-none cursor-pointer text-center ${
                        activePlan === "ouro" ? "bg-amber-400 text-neutral-950 hover:bg-amber-500" : "bg-neutral-800 hover:bg-zinc-700 text-white"
                      }`}
                    >
                      {activePlan === "ouro" ? "✓ Seu Plano Ativo" : "Selecionar Ouro"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Route 4: NEW GOODS REGISTRATION & COMMUNITY CATALOG MANAGEMENT SCREEN */}
            {activeRoute === "produtos" && (
              <div className="space-y-8 animate-fade-in">
                {/* Breadcrumb section */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveRoute("hub")}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                  >
                    ← Voltar para o Hub de Fornecedores
                  </button>
                  <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                    Área Logística do Fornecedor
                  </span>
                </div>

                {registrationSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-200 rounded-[22px] flex items-center gap-3 text-emerald-800 text-xs shadow-xs"
                  >
                    <Check className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-extrabold font-sans">
                        {editingProductIndex !== null ? "Catálogo atualizado com sucesso!" : "Insumo publicado com sucesso no Hub!"}
                      </p>
                      <p className="opacity-90 font-medium">As alterações de sua oferta já refletem instantaneamente nas pesquisas do feed geral para todos os clientes.</p>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Form to Register/Edit Goods */}
                  <div className="lg:col-span-5 bg-neutral-50 p-6 sm:p-8 rounded-[32px] border border-neutral-200/50 space-y-6">
                    <div>
                      <span className="text-[9px] font-black text-brand-red uppercase tracking-wider">Passo 2 de 2</span>
                      <h3 className="font-extrabold text-neutral-950 text-base sm:text-lg tracking-tight">
                        {editingProductIndex !== null ? "📝 Editar Insumo Cadastrado" : "📦 Cadastrar Produto / Insumo"}
                      </h3>
                      <p className="text-xs text-neutral-400 font-medium">
                        {editingProductIndex !== null 
                          ? "Edite abaixo o preço, unidade de medida ou disponibilidade imediata para este produto." 
                          : "Defina o preço emergencial, tipo de unidade e se possui estoque pronto para entrega imediata."}
                      </p>
                    </div>

                    <form 
                      onSubmit={handleRegisterSupplier}
                      className="space-y-4 text-xs font-medium"
                    >
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] block">Nome do Produto / Oferta Comercial</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Farinha de Trigo Tipo 1 - Saco 50kg"
                          value={newSupName}
                          onChange={(e) => setNewSupName(e.target.value)}
                          className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-bold text-neutral-400 uppercase text-[9px] block font-sans">Preço do Insumo</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="Ex: R$ 145,00 ou Sob Consulta"
                            value={productPrice}
                            onChange={(e) => setProductPrice(e.target.value)}
                            className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-neutral-400 uppercase text-[9px] block font-sans">Unidade de Medida</label>
                          <select 
                            value={productUnit} 
                            onChange={(e) => setProductUnit(e.target.value)}
                            className="w-full p-3 bg-white border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800 font-sans"
                          >
                            <option value="Saco">Saco</option>
                            <option value="Pacote">Pacote</option>
                            <option value="Balde">Balde</option>
                            <option value="Caixa">Caixa</option>
                            <option value="Fardo">Fardo</option>
                            <option value="Unidade">Unidade</option>
                            <option value="Kg">Kg</option>
                            <option value="Litro">Litro</option>
                            <option value="Lote">Lote / Pallet</option>
                          </select>
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-neutral-200/50 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-bold text-neutral-800 text-[11px]">Entrega Imediata de Emergência?</p>
                          <p className="text-[9px] text-neutral-400 font-medium">Disponível para entrega imediata em até 45 min</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={productImmediate}
                          onChange={(e) => setProductImmediate(e.target.checked)}
                          className="w-4 h-4 text-brand-red rounded focus:ring-brand-red cursor-pointer"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button 
                          type="submit"
                          className="flex-1 py-3.5 bg-brand-charcoal hover:bg-neutral-850 text-white font-extrabold rounded-full text-xs transition-transform active:scale-98 uppercase tracking-wide border-none cursor-pointer text-center"
                        >
                          {editingProductIndex !== null ? "Salvar Alterações ✓" : "Adicionar no Catálogo 🚀"}
                        </button>
                        
                        {editingProductIndex !== null && (
                          <button 
                            type="button"
                            onClick={handleCancelEditProduct}
                            className="py-3.5 px-5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-extrabold rounded-full text-xs transition-transform active:scale-98 uppercase tracking-wide border-none cursor-pointer text-center font-sans"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* List of active goods and deletion tool */}
                  <div className="lg:col-span-7 bg-neutral-50 p-6 sm:p-8 rounded-[32px] border border-neutral-200/50 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-extrabold text-neutral-950 text-base sm:text-lg tracking-tight">Catálogo de Produtos & Serviços</h3>
                        <p className="text-xs text-neutral-400 font-medium">
                          Estes são os insumos ativos listados para a sua empresa (<span className="text-neutral-700 font-bold">{session.fornecedorData?.nomeEmpresa || "Sua Distribuidora"}</span>).
                        </p>
                      </div>

                      <div className="divide-y divide-neutral-250/50 max-h-[460px] overflow-y-auto pr-1">
                        {(() => {
                          const myCompany = suppliers.find(s => s.id === "sup-logged-fornecedor");
                          const catalog = myCompany?.catalogItems || [];
                          if (catalog.length === 0) {
                            return (
                              <div className="text-center py-12 text-zinc-400 text-xs italic space-y-2">
                                <span className="text-2xl block text-neutral-300">📦</span>
                                <p>Sua distribuidora não possui produtos cadastrados no catálogo.</p>
                                <p className="text-[10px] text-neutral-450 not-italic">Utilize o formulário ao lado para cadastrar produtos em tempo real!</p>
                              </div>
                            );
                          }
                          return catalog.map((item, idx) => (
                            <div key={idx} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-3">
                                {/* Perfectly matches user request: image of the item is the company's logo */}
                                <span className="text-3xl p-2 bg-white border border-neutral-200/60 rounded-2xl shadow-xs select-none">
                                  {myCompany?.logo || "🏢"}
                                </span>
                                <div>
                                  <h4 className="font-extrabold text-neutral-950 text-xs">{item.name}</h4>
                                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                                    Preço: <span className="text-neutral-900 font-bold">{item.price}</span> • Unidade: <span className="text-neutral-900 font-bold">{item.unit || "Pacote"}</span>
                                  </p>
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase mt-1 px-2 py-0.5 rounded-full ${
                                    item.immediateAvailable 
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                                      : "bg-amber-50 text-amber-700 border border-amber-100"
                                  }`}>
                                    {item.immediateAvailable ? "⚡ Entrega Imediata" : "⏰ A Combinar"}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditProduct(idx, item)}
                                  className="p-2 py-1 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg text-[10px] font-bold text-neutral-700 cursor-pointer transition-all active:scale-95"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(idx)}
                                  className="w-8 h-8 rounded-full hover:bg-brand-red/10 text-neutral-450 hover:text-brand-red flex items-center justify-center border-none transition-all cursor-pointer bg-transparent font-bold text-sm"
                                  title="Remover produto do catálogo"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-200/50 flex justify-between items-center text-xs text-neutral-400 font-medium font-sans">
                      <span>Total de insumos ativos no catálogo:</span>
                      <span className="font-bold text-neutral-900 bg-white border border-neutral-200 px-3 py-1 rounded-full">
                        {(() => {
                          const myCompany = suppliers.find(s => s.id === "sup-logged-fornecedor");
                          return myCompany?.catalogItems.length || 0;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Route 5: SOS DE EMERGÊNCIA & MAP PANEL DASHBOARD */}
            {activeRoute === "sos_dashboard" && (
              <div className="space-y-8 animate-fade-in">
                {/* Breadcrumb section */}
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveRoute("hub")}
                    className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-brand-charcoal transition-colors border-none bg-transparent cursor-pointer"
                  >
                    ← Voltar para o Hub de Fornecedores
                  </button>
                  <span className="text-[10px] font-bold text-brand-red bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider font-sans border border-rose-100 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red"></span>
                    Central de Ruptura Ativa
                  </span>
                </div>

                <div className="text-center space-y-2 max-w-2xl mx-auto py-4">
                  <h2 className="text-2.5xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 flex items-center justify-center gap-2">
                    🚨 Monitor SOS de Emergências
                  </h2>
                  <p className="text-neutral-500 text-xs sm:text-sm font-medium">
                    Atenda chamados de desabastecimento em tempo real na sua área de registro. Salve o dia de um parceiro comercial local!
                  </p>
                </div>

                {/* Dashboard grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Half: Map component */}
                  <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-[32px] border border-neutral-200/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-extrabold text-neutral-950 text-base tracking-tight flex items-center gap-1.5">
                          <span>🗺️ Mapa de Cobertura e Alertas</span>
                        </h3>
                        <p className="text-neutral-400 text-xs font-medium mt-0.5 animate-fade-in">
                          Sua sede em <span className="text-neutral-900 font-bold">{forAddress || "Brás, São Paulo"}</span> possui raio de 4km em destaque sobre os alertas vermelhos piscando.
                        </p>
                      </div>
                    </div>

                    <EmergencyMap
                      registeredArea={forAddress || "Brás, São Paulo"}
                      emergencyRequests={emergencyRequests}
                      selectedRequestId={selectedEmergencyRequestId}
                      onSelectRequest={(id) => setSelectedEmergencyRequestId(id)}
                    />
                  </div>

                  {/* Right Half: Request feed lists */}
                  <div className="lg:col-span-5 bg-neutral-50 p-6 sm:p-7 rounded-[32px] border border-neutral-200/50 space-y-5 flex flex-col justify-between">
                    <div className="space-y-4 flex-grow flex flex-col">
                      <div>
                        <h3 className="font-extrabold text-neutral-950 text-base tracking-tight flex items-center gap-1.5">
                          <span>📌 Alertas Emitidos ({emergencyRequests.length})</span>
                        </h3>
                        <p className="text-neutral-400 text-xs font-medium">
                          Filtros de gravidade em tempo real. Clique em um alerta para focar no mapa integrado.
                        </p>
                      </div>

                      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 flex-grow">
                        {emergencyRequests.length === 0 ? (
                          <div className="text-center py-20 text-neutral-400 text-xs italic space-y-2">
                            <span>✅</span>
                            <p>Nenhuma emergência de desabastecimento relatada hoje!</p>
                          </div>
                        ) : (
                          emergencyRequests.map((req) => (
                            <div 
                              key={req.id}
                              onClick={() => {
                                setSelectedEmergencyRequestId(req.id);
                              }}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                                selectedEmergencyRequestId === req.id
                                  ? "bg-white border-brand-red ring-2 ring-brand-red/15 shadow-sm"
                                  : "bg-white hover:bg-neutral-100/60 border-neutral-200/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold uppercase py-0.5 px-2 bg-rose-50 text-brand-red border border-rose-100 rounded-md font-mono">
                                  {req.categoryName}
                                </span>
                                <span className="text-[10px] font-semibold text-neutral-400">
                                  {req.timestamp}
                                </span>
                              </div>
                              
                              <h4 className="font-extrabold text-neutral-950 text-xs mt-2.5 flex items-center gap-1">
                                {req.companyName}
                              </h4>
                              
                              <p className="text-neutral-600 text-[11px] leading-relaxed mt-1 font-medium italic">
                                "{req.itemDescription}"
                              </p>
                              
                              <div className="mt-3 pt-3 border-t border-neutral-150 flex justify-between items-center">
                                <p className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-neutral-400" />
                                  <span className="truncate max-w-[120px]">{req.address}</span>
                                </p>
                                
                                <a
                                  href={`https://wa.me/${forPhone.replace(/\D/g, '') || "11987650102"}?text=Olá!%20Sou%20o%20representante%20da%20distribuidora%20${encodeURIComponent(forNomeEmpresa)}%20pelo%20Hub%20SupplYES%20e%20vi%2520seu%20alerta%20SOS%20de%20ruptura%20de%20${encodeURIComponent(req.categoryName)}.%20Estou%20com%20estoque%20aqui%20e%20posso%20liberar%20despacho%20imediato!%20Vamos%20fechar?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    e.stopPropagation(); // prevent select parent card click
                                  }}
                                  className="py-1.5 px-3 bg-neutral-900 hover:bg-neutral-850 text-white rounded-lg text-[10px] font-extrabold transition-all border-none select-none cursor-pointer text-center no-underline"
                                >
                                  Atender SOS ⚡
                                </a>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </main>

      {/* 6. CLEAN FOOTER - Clean minimalist footer matching wireframe */}
      <footer className="w-full bg-neutral-50/60 border-t border-neutral-100 py-12 px-4 mt-12">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          
          {/* Logo brand — Footer Placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-200/50 border border-neutral-300/30 flex items-center justify-center overflow-hidden shrink-0" title="Placeholder de Logo">
              <span className="text-[8px] font-black tracking-tight text-neutral-500 font-mono">LOGO</span>
            </div>
            <span className="font-extrabold text-xs text-neutral-900 tracking-wider uppercase">SUPPLYES HUB</span>
          </div>

          {/* Minimalist central info */}
          <span className="text-xs text-neutral-400 font-medium text-center md:text-left leading-relaxed">
            © 2026 SupplYES Hub de Conexão de Fornecedores • Realizado por NextGen Code
          </span>

          {/* Quick legal/support badges */}
          <div className="flex gap-4 text-xs text-neutral-500 font-bold uppercase tracking-tight">
            <a href="#" className="hover:text-black transition-colors" onClick={(e) => { e.preventDefault(); alert("Fase 1: Protótipo Visual Completo. Banco de dados integrado em breve!"); }}>Suporte</a>
            <a href="#" className="hover:text-black transition-colors" onClick={(e) => { e.preventDefault(); alert("Protótipo sob termos de desenvolvimento sandbox."); }}>Políticas</a>
            {session.userType !== "fornecedor" && (
              <a href="#" className="hover:text-black transition-colors" onClick={(e) => { e.preventDefault(); setShowSOSModal(true); }}>Emergências</a>
            )}
          </div>

        </div>
      </footer>

      {/* ----------------- MODALS & OVERLAYS ----------------- */}

      {/* A. Supplier Detailed View Overlay */}
      <AnimatePresence>
        {activeSupplierId && activeSupplier && (
          <SupplierDetailModal
            supplier={activeSupplier}
            onClose={() => setActiveSupplierId(null)}
            onAddReview={handleAddReview}
          />
        )}
      </AnimatePresence>

      {/* B. SOS Request Overlay Drawer */}
      <AnimatePresence>
        {showSOSModal && (
          <SOSRequestModal
            categories={CATEGORIES}
            onClose={() => setShowSOSModal(false)}
            onSOSSubmit={handleSOSSubmit}
          />
        )}
      </AnimatePresence>

      {/* B2. Supplier Special Simulated Alarms Panel */}
      <AnimatePresence>
        {showSupplierSOSModal && (
          <SupplierSOSModal
            categories={CATEGORIES}
            onClose={() => setShowSupplierSOSModal(false)}
            onTriggerAlert={(newSimulatedRequest) => {
              // Resolve coords based on simulation address
              let locCoords = { lat: -23.5621, lng: -46.6853 }; // default Pinheiros
              const lowerAddress = newSimulatedRequest.address.toLowerCase();
              for (const [key, coords] of Object.entries(NEIGHBORHOOD_COORDS)) {
                if (lowerAddress.includes(key)) {
                  locCoords = coords;
                  break;
                }
              }

              const fullRequest = {
                ...newSimulatedRequest,
                // slight jitter to make sure multiple mock pins don't overlap exactly
                lat: locCoords.lat + (Math.random() - 0.5) * 0.008,
                lng: locCoords.lng + (Math.random() - 0.5) * 0.008,
              };

              setEmergencyRequests(prev => [fullRequest, ...prev]);

              // Automatically focus on this category and activate emergency shipping toggle!
              setSelectedCategories(prev => {
                const categoryId = newSimulatedRequest.categoryId;
                if (prev.includes(categoryId)) return prev;
                return [...prev, categoryId];
              });
              setEmergencyOnly(true);
              setSearchQuery("");
            }}
          />
        )}
      </AnimatePresence>

      {/* C. Cadastrar Fornecimento - Beautiful Floating Apple Form */}
      <AnimatePresence>
        {showRegisterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRegisterModal(false)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white text-neutral-900 rounded-[32px] p-6 shadow-2xl border border-neutral-100 z-10 space-y-5"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-neutral-900 text-lg">Novo Anúncio de Atacado</h3>
                  <p className="text-[11px] text-neutral-400 font-medium">Cadastre seu negócio de fornecimento no Hub</p>
                </div>
                <button 
                  id="close-register-btn"
                  onClick={() => setShowRegisterModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 border-none transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {registrationSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 p-6 rounded-2xl text-xs font-bold text-center space-y-2">
                  <p>Inscrição cadastrada!</p>
                  <p className="font-normal text-neutral-500 text-[11px]">Seu estabelecimento comercial foi adicionado ao topo do feed para simulação instantânea.</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSupplier} className="space-y-3.5 text-xs">
                  
                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Nome do Fornecedor / Empresa</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Embalagens Premium do Centro"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Categoria Principal</label>
                      <select 
                        value={newSupCategory}
                        onChange={(e) => setNewSupCategory(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      >
                        {CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Bairro / Cidade Base</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ex: Lapa, São Paulo"
                        value={newSupLocation}
                        onChange={(e) => setNewSupLocation(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Valor de Pedido Mínimo (R$)</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 150"
                      value={newSupMinOrder}
                      onChange={(e) => setNewSupMinOrder(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                    />
                  </div>

                  <div className="bg-neutral-50 p-3 rounded-2xl space-y-2 border border-neutral-100">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-neutral-600 block text-[11px]">Você faz entregas emergenciais rápidas?</label>
                      <input 
                        type="checkbox"
                        checked={newSupImmediate}
                        onChange={(e) => setNewSupImmediate(e.target.checked)}
                        className="w-4.5 h-4.5 accent-brand-red rounded cursor-pointer"
                      />
                    </div>
                    {newSupImmediate && (
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[8px] tracking-wider block">Estimativa de Tempo SOS</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Imediato (Em até 35 min)"
                          value={newSupDeliveryTime}
                          onChange={(e) => setNewSupDeliveryTime(e.target.value)}
                          className="w-full p-2.5 bg-white border border-neutral-200/60 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Breve Descrição do que Fornece</label>
                    <textarea 
                      rows={2}
                      placeholder="Fale quais insumos ou produtos tem a pronta entrega"
                      value={newSupDesc}
                      onChange={(e) => setNewSupDesc(e.target.value)}
                      className="w-full p-2.5 bg-neutral-50 border border-neutral-200/60 rounded-xl outline-none focus:bg-white text-xs font-medium text-neutral-800"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white font-bold rounded-full text-xs active:scale-95 transition-all outline-none border-none cursor-pointer"
                  >
                    Publicar Meu Fornecimento
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. SignUp Modal (Empreendedor or Fornecedor Profile forms) */}
      <AnimatePresence>
        {showSignUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignUpModal(null)}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] p-6 sm:p-8 shadow-2xl border border-neutral-100 z-10 max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-neutral-950 text-lg sm:text-xl tracking-tight">
                    Criar Perfil de {showSignUpModal === "empreendedor" ? "Empreendedor" : "Fornecedor"}
                  </h3>
                  <p className="text-xs text-neutral-400 font-medium">
                    Preencha os dados reais para se cadastrar no SupplYES Hub. Seu perfil será conectado com segurança.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSignUpModal(null)}
                  className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-black flex items-center justify-center border-none transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
 
               {/* DATABASE PROFILE LOOKUP BY EMAIL AND PASSWORD */}
               <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 space-y-3">
                 <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">🔑 Já possui cadastro no Banco de Dados?</span>
                 <form onSubmit={handleEmailLookup} className="space-y-2">
                   <div className="flex flex-col sm:flex-row gap-2">
                     <input
                       type="email"
                       placeholder="E-mail cadastrado"
                       value={lookupEmail}
                       onChange={(e) => setLookupEmail(e.target.value)}
                       className="flex-grow p-2 bg-white border border-neutral-200 rounded-xl outline-none text-xs text-neutral-800"
                       required
                     />
                     <input
                       type="password"
                       placeholder="Senha de Acesso"
                       value={lookupPassword}
                       onChange={(e) => setLookupPassword(e.target.value)}
                       className="flex-grow sm:w-44 p-2 bg-white border border-neutral-200 rounded-xl outline-none text-xs text-neutral-800"
                       required
                     />
                   </div>
                   <button
                     type="submit"
                     disabled={isLookingUp}
                     className="w-full py-2 bg-brand-charcoal hover:bg-neutral-850 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer flex items-center justify-center gap-1 border-none"
                   >
                     {isLookingUp ? "Buscando..." : "Entrar com Senha de Segurança 🔒"}
                   </button>
                 </form>
                 {lookupError && (
                   <p className="text-[10px] font-semibold text-brand-red select-none">{lookupError}</p>
                 )}
               </div>
 
               <form 
                 onSubmit={async (e) => {
                   e.preventDefault();
                   if (showSignUpModal === "empreendedor") {
                     if (!empEmail || !empNomeCompleto || !empNomeEmpresa || !empPassword) {
                       alert("Por favor, preencha todos os campos obrigatórios (incluindo a Senha).");
                       return;
                     }
                     const empData: EmpreendedorProfile = {
                       nomeCompleto: empNomeCompleto,
                       nomeEmpresa: empNomeEmpresa,
                       cpfCnpj: empCpfCnpj || "Não informado",
                       email: empEmail,
                       telefone: empTelefone || "Não informado",
                       endereco: empEndereco || "Não informado",
                       foto: empFoto || "👨‍💼"
                     };
                     try {
                       await dbRepo.saveUserProfile("empreendedor", empEmail, empPassword, empData);
                       setSession({
                         userType: "empreendedor",
                         password: empPassword,
                         empreendedorData: empData,
                         fornecedorData: null
                       });
                       alert("Cadastro de Empreendedor realizado e salvo com sucesso no Banco de Dados!");
                     } catch (err) {
                       console.error(err);
                       alert("Falha ao salvar seu perfil no Banco de Dados.");
                     }
                   } else {
                     if (!forEmail || !forNomeEmpresa || !forNichoCategoria || !forPassword) {
                       alert("Por favor, preencha todos os campos obrigatórios (incluindo a Senha).");
                       return;
                     }
                     const forData: FornecedorProfile = {
                       nomeEmpresa: forNomeEmpresa,
                       nichoCategoria: forNichoCategoria,
                       email: forEmail,
                       telefone: forPhone || "Não informado",
                       endereco: forAddress || "Não informado",
                       fotoPerfil: forFotoPerfil || "🏢",
                       cnpj: forCnpj || "Não informado",
                       descricao: forDescricao || ""
                     };
                     try {
                       await dbRepo.saveUserProfile("fornecedor", forEmail, forPassword, forData);
                       setSession({
                         userType: "fornecedor",
                         password: forPassword,
                         empreendedorData: null,
                         fornecedorData: forData
                       });
                       
                       // Sincronizar fornecedor nos fornecedores gerais para aparecer na busca do hub
                       const newSupId = `sup-${forEmail.replace(/[@.]/g, "-")}`;
                       const updatedSupplier: Supplier = {
                         id: newSupId,
                         name: forNomeEmpresa,
                         logo: forFotoPerfil || "🏢",
                         category: forNichoCategoria,
                         location: forAddress || "A combinar",
                         rating: 5.0,
                         reviewsCount: 0,
                         fastDelivery: true,
                         deliveryTime: "Imediato",
                         minOrderValue: 0,
                         whatsappUrl: `https://wa.me/${(forPhone || "").replace(/\D/g, "")}`,
                         description: forDescricao || "Fornecedor cadastrado",
                         tags: ["Verificado", forNichoCategoria],
                         verified: true,
                         contactEmail: forEmail,
                         contactPhone: forPhone,
                         catalogItems: [],
                         reviews: []
                       };
                       await dbRepo.saveSupplier(updatedSupplier);
                       // Update local list
                       setSuppliers(prev => [updatedSupplier, ...prev.filter(s => s.contactEmail !== forEmail)]);
                       
                       alert("Cadastro de Fornecedor realizado e salvo com sucesso no Banco de Dados!");
                     } catch (err) {
                       console.error(err);
                       alert("Falha ao salvar seu perfil no Banco de Dados.");
                     }
                   }
                   setShowSignUpModal(null);
                 }}
                 className="space-y-4 text-xs"
               >
                {showSignUpModal === "empreendedor" ? (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Nome Completo</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Guilherme Santos"
                        value={empNomeCompleto}
                        onChange={(e) => setEmpNomeCompleto(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800 focus:border-neutral-400"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Nome do Empreendimento</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: Santos Pizzaria Express"
                          value={empNomeEmpresa}
                          onChange={(e) => setEmpNomeEmpresa(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">CPF / CNPJ do negócio</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: 123.456.789-10"
                          value={empCpfCnpj}
                          onChange={(e) => setEmpCpfCnpj(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">E-mail Comercial</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="Ex: guilherme@pizzaria.com"
                          value={empEmail}
                          onChange={(e) => setEmpEmail(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Senha de Segurança (Mín. 4 caract.)</label>
                        <input 
                          type="password" 
                          required 
                          minLength={4}
                          placeholder="Digite sua senha"
                          value={empPassword}
                          onChange={(e) => setEmpPassword(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Telefone Comercial WhatsApp</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: (11) 99999-8888"
                        value={empTelefone}
                        onChange={(e) => setEmpTelefone(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Endereço de Entrega</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Consolação, São Paulo - SP"
                        value={empEndereco}
                        onChange={(e) => setEmpEndereco(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Razão Social ou Nome Fantasia da Distribuidora</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Embalagens Express SP"
                        value={forNomeEmpresa}
                        onChange={(e) => setForNomeEmpresa(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Nicho / Categoria Principal</label>
                        <select 
                          value={forNichoCategoria}
                          onChange={(e) => setForNichoCategoria(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none text-xs font-semibold text-neutral-800"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">CNPJ da Distribuidora</label>
                        <input 
                          type="text" 
                          required 
                          placeholder="Ex: 55.444.333/0001-20"
                          value={forCnpj}
                          onChange={(e) => setForCnpj(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">E-mail Comercial (Vendas)</label>
                        <input 
                          type="email" 
                          required 
                          placeholder="Ex: comercial@embalagenssp.com"
                          value={forEmail}
                          onChange={(e) => setForEmail(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Senha de Segurança (Mín. 4 caract.)</label>
                        <input 
                          type="password" 
                          required 
                          minLength={4}
                          placeholder="Digite sua senha"
                          value={forPassword}
                          onChange={(e) => setForPassword(e.target.value)}
                          className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">WhatsApp Comercial para Pedidos</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: (11) 98765-0102"
                        value={forPhone}
                        onChange={(e) => setForPhone(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-neutral-400 uppercase text-[9px] tracking-wider block">Endereço do Centro de Distribuição / Galpão</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ex: Brás, São Paulo - SP"
                        value={forAddress}
                        onChange={(e) => setForAddress(e.target.value)}
                        className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl outline-none focus:bg-white text-xs font-semibold text-neutral-800"
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-brand-charcoal text-white font-extrabold rounded-full text-xs hover:bg-neutral-850 active:scale-95 transition-all text-center border-none cursor-pointer uppercase tracking-wider"
                >
                  Registrar Perfil e Conectar ✨
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. Slide-Out Sidebar Drawer Menu */}
      <AnimatePresence>
        {showSidebar && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white border-l border-neutral-100 flex flex-col justify-between shadow-2xl relative"
              >
                {/* Header of Drawer */}
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    <div>
                      <h3 className="font-extrabold text-neutral-950 text-sm tracking-tight leading-none">Painel de Controle</h3>
                      <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-1">
                        Sessão de {session.userType === "empreendedor" ? "Empreendedor" : "Fornecedor"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowSidebar(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 border-none transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Content with custom options */}
                <div className="p-6 flex-grow overflow-y-auto space-y-6">
                  
                  {/* Current Active Account Card with Badge */}
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100/50 flex items-center gap-3">
                    <div className="w-12 h-12 bg-neutral-200/50 rounded-full flex items-center justify-center text-xl shrink-0">
                      {session.userType === "empreendedor" ? "👨‍💼" : "🏬"}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-neutral-950 text-sm tracking-tight">
                        {session.userType === "empreendedor" 
                          ? session.empreendedorData?.nomeCompleto 
                          : session.fornecedorData?.nomeEmpresa}
                      </h4>
                      <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider leading-none mt-1">
                        {session.userType === "empreendedor" 
                          ? session.empreendedorData?.nomeEmpresa 
                          : `Nicho: ${session.fornecedorData?.nichoCategoria.toUpperCase()}`}
                      </p>
                    </div>
                  </div>

                  {/* Navigation list */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Minha Área Segura:</span>
                    
                    <div className="flex flex-col gap-2.5 text-xs text-neutral-850">
                      
                      {/* Button 1: Meu Perfil (Both) */}
                      <button
                        onClick={() => {
                          setActiveRoute("perfil");
                          setShowSidebar(false);
                        }}
                        className={`w-full p-3.5 rounded-xl text-left border-none flex items-center gap-3 transition-colors cursor-pointer ${
                          activeRoute === "perfil" 
                            ? "bg-brand-charcoal text-white font-extrabold" 
                            : "bg-transparent text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <span className="text-base">👤</span>
                        <div className="flex-grow">
                          <p className="leading-tight font-bold">Meu Perfil</p>
                          <p className={`text-[10px] ${activeRoute === "perfil" ? "text-neutral-300" : "text-neutral-400"}`}>Logo, endereço completo e contato</p>
                        </div>
                      </button>

                      {/* Button 2: Hub de Fornecedores / Retornar (Both) */}
                      <button
                        onClick={() => {
                          setActiveRoute("hub");
                          setShowSidebar(false);
                        }}
                        className={`w-full p-3.5 rounded-xl text-left border-none flex items-center gap-3 transition-colors cursor-pointer ${
                          activeRoute === "hub" 
                            ? "bg-brand-charcoal text-white font-extrabold" 
                            : "bg-transparent text-neutral-700 hover:bg-neutral-50"
                        }`}
                      >
                        <span className="text-base">📦</span>
                        <div className="flex-grow">
                          <p className="leading-tight font-bold">Hub de Fornecedores</p>
                          <p className={`text-[10px] ${activeRoute === "hub" ? "text-neutral-300" : "text-neutral-400"}`}>Ir para a busca do feed geral</p>
                        </div>
                      </button>

                      {/* Button 3: Meus Planos (Only Fornecedor) */}
                      {session.userType === "fornecedor" && (
                        <button
                          onClick={() => {
                            setActiveRoute("planos");
                            setShowSidebar(false);
                          }}
                          className={`w-full p-3.5 rounded-xl text-left border-none flex items-center gap-3 transition-colors cursor-pointer ${
                            activeRoute === "planos" 
                              ? "bg-brand-charcoal text-white font-extrabold" 
                              : "bg-transparent text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="text-base">💎</span>
                          <div className="flex-grow">
                            <p className="leading-tight font-bold">Meus Planos</p>
                            <p className={`text-[10px] ${activeRoute === "planos" ? "text-neutral-300" : "text-neutral-400"}`}>Visualizar preços de destaque</p>
                          </div>
                        </button>
                      )}

                      {/* Button 4: Insumos Cadastrados (Only Fornecedor) */}
                      {session.userType === "fornecedor" && (
                        <button
                          onClick={() => {
                            setActiveRoute("produtos");
                            setShowSidebar(false);
                          }}
                          className={`w-full p-3.5 rounded-xl text-left border-none flex items-center gap-3 transition-colors cursor-pointer ${
                            activeRoute === "produtos" 
                              ? "bg-brand-charcoal text-white font-extrabold" 
                              : "bg-transparent text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          <span className="text-base">📝</span>
                          <div className="flex-grow">
                            <p className="leading-tight font-bold">Insumos e Catálogo</p>
                            <p className={`text-[10px] ${activeRoute === "produtos" ? "text-neutral-300" : "text-neutral-400"}`}>Veja o status de seus anúncios</p>
                          </div>
                        </button>
                      )}

                      {/* Button 5: SOS de Emergência & Mapa (Only Fornecedor) */}
                      {session.userType === "fornecedor" && (
                        <button
                          onClick={() => {
                            setActiveRoute("sos_dashboard");
                            setShowSidebar(false);
                          }}
                          className={`w-full p-3.5 rounded-xl text-left border-none flex items-center gap-3 transition-all cursor-pointer ${
                            activeRoute === "sos_dashboard" 
                              ? "bg-brand-red text-white font-extrabold" 
                              : "bg-rose-50 hover:bg-rose-100 text-rose-750"
                          }`}
                        >
                          <span className="text-base animate-pulse">🚨</span>
                          <div className="flex-grow">
                            <p className="leading-tight font-bold">SOS de Emergência & Mapa</p>
                            <p className={`text-[10px] ${activeRoute === "sos_dashboard" ? "text-rose-100" : "text-rose-500 font-semibold"}`}>Lugares precisando de entrega urgente</p>
                          </div>
                        </button>
                      )}

                      {/* Seja Fornecedor se for empreendedor (Cleanly integrated without crooked extra margin offset) */}
                      {session.userType === "empreendedor" && (
                        <button
                          onClick={() => {
                            setShowSidebar(false);
                            setShowSignUpModal("fornecedor");
                          }}
                          className="w-full p-3.5 rounded-xl text-left border-none bg-emerald-50 hover:bg-emerald-100 flex items-center gap-3 transition-colors cursor-pointer text-emerald-900"
                        >
                          <span className="text-base">🚀</span>
                          <div className="flex-grow">
                            <p className="font-extrabold leading-tight">Anuncie Insumos (Seja Fornecedor)</p>
                            <p className="text-[10px] text-emerald-700 font-medium">Cadastre distribuidora emergencial</p>
                          </div>
                        </button>
                      )}

                    </div>
                  </div>

                  {/* ACTIVE TAB DEEP-DIVE DETAILS */}
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 text-neutral-500 font-medium">
                    {activeTabSidebar === "perfil" && (
                      <div className="space-y-4">
                        {/* BANCO DE DADOS STATUS BAR */}
                        <div className="p-3.5 rounded-2xl bg-white border border-neutral-100 shadow-xs space-y-3.5 text-xs text-neutral-600">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-[#09090b] text-[10px] uppercase tracking-wider">Storage e Banco de Dados (Supabase)</span>
                            <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-50 text-emerald-705 border border-emerald-200" : "bg-amber-50 text-amber-707 border border-amber-202"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-550"}`} />
                              {isSupabaseConfigured ? "Supabase Cloud" : "Local Sandbox"}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                            {isSupabaseConfigured 
                              ? "A aplicação está sincronizada e gravando dados dinamicamente diretamente nas tabelas de produção do seu Supabase SQL."
                              : "Utilizando Storage Local (LocalStorage Sandbox). Os dados como categorias, fornecedores, avaliações, funcionários e perfis persistem e funcionam perfeitamente!"
                            }
                          </p>
                          
                          {/* SHOW SCHEMAS SQL OPTION */}
                          <div className="pt-2.5 border-t border-neutral-100 flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-neutral-400 block">Esquema SQL para Criar Tabelas no Supabase:</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
                                alert("Comando SQL copiado com sucesso! Insira no SQL Editor do seu Supabase.");
                              }}
                              className="w-full text-left p-2.5 bg-neutral-905 text-white rounded-xl text-[9px] font-mono hover:bg-neutral-800 font-medium transition-colors flex items-center justify-between pointer-events-auto select-all cursor-pointer border-none"
                            >
                              <span>Visualizar / Copiar SQL de Configuração 📋</span>
                              <span className="opacity-65 text-[8px] uppercase tracking-widest font-sans font-bold">Copy SQL</span>
                            </button>
                          </div>
                        </div>

                        <span className="font-bold text-neutral-850 uppercase text-[9px] tracking-wider block">Ficha de Perfil Ativo:</span>
                        <div className="space-y-2 text-xs leading-normal">
                          <p><b>Nome / Empresa:</b> {session.userType === "empreendedor" ? session.empreendedorData?.nomeCompleto : session.fornecedorData?.nomeEmpresa}</p>
                          <p><b>Empresa Nome Comercial:</b> {session.userType === "empreendedor" ? session.empreendedorData?.nomeEmpresa : "Distribuição Própria"}</p>
                          <p><b>E-mail Comercial:</b> {session.userType === "empreendedor" ? session.empreendedorData?.email : session.fornecedorData?.email}</p>
                          <p><b>Telefone / WhatsApp:</b> {session.userType === "empreendedor" ? session.empreendedorData?.telefone : session.fornecedorData?.telefone}</p>
                          <p><b>Documento Governamental:</b> {session.userType === "empreendedor" ? session.empreendedorData?.cpfCnpj : session.fornecedorData?.cnpj}</p>
                          <p><b>Cidade Base do Empreendimento:</b> {session.userType === "empreendedor" ? session.empreendedorData?.endereco : session.fornecedorData?.endereco}</p>
                        </div>
                      </div>
                    )}

                    {activeTabSidebar === "planos" && (
                      <div className="space-y-3">
                        <span className="font-bold text-neutral-800 uppercase text-[9px] tracking-wider block">Faturamento e Planos:</span>
                        <p className="text-[11px] text-neutral-400 leading-normal">Assinaturas de posicionamento no topo do SupplYES.</p>
                        <div className="space-y-2">
                          <div className="p-2.5 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-neutral-800 text-[11px]">Plano Básico (Gratuito)</p>
                              <p className="text-[9px] text-neutral-400">Atendimento normal do Hub</p>
                            </div>
                            <span className="text-[9px] bg-neutral-200 text-neutral-700 px-2 rounded-md font-bold">Ativo</span>
                          </div>
                          
                          <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between opacity-50 cursor-not-allowed">
                            <div>
                              <p className="font-bold text-neutral-800 text-[11px]">Destacado SOS Premium</p>
                              <p className="text-[9px] text-neutral-400">Push-alarme nos celulares de padarias</p>
                            </div>
                            <span className="text-[9px] bg-neutral-100 text-neutral-650 px-2 rounded-md font-bold">R$ 49/mês</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTabSidebar === "produtos" && (
                      <div className="space-y-3">
                        <span className="font-bold text-neutral-800 uppercase text-[9px] tracking-wider block">Seu Catálogo Publicado:</span>
                        <div className="space-y-2">
                          {suppliers.filter(s => s.contactEmail === session.fornecedorData?.email).length === 0 ? (
                            <p className="text-neutral-400 text-xs italic">Você ainda não cadastrou nenhum insumo pós-login! Use o botão "Anunciar" para enviar agora.</p>
                          ) : (
                            suppliers.filter(s => s.contactEmail === session.fornecedorData?.email).map((s, idx) => (
                              <div key={idx} className="p-2 bg-white rounded-xl border border-neutral-200 flex justify-between items-center text-xs">
                                <span className="font-bold text-neutral-800">{s.name}</span>
                                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold">{s.category.toUpperCase()}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                </div>

                {/* Footer of Drawer (Log Out) */}
                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setSession({ userType: null, empreendedorData: null, fornecedorData: null });
                      setShowSidebar(false);
                      handleClearFilters();
                    }}
                    className="w-full py-2.5 bg-brand-red select-none text-white hover:bg-brand-red/90 rounded-full font-bold text-xs border-none cursor-pointer transition-all uppercase tracking-wide flex items-center justify-center gap-1"
                  >
                    Sair da Conta 🚪
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* E. Action Privilege Warning Modal Overlay */}
      <AnimatePresence>
        {actionWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActionWarning(null)}
              className="absolute inset-0 bg-neutral-900/55 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-6 text-center space-y-5 border border-neutral-100 shadow-2xl z-10"
            >
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-2xl text-amber-500 mx-auto border border-neutral-200/50">
                🔒
              </div>
              <div className="space-y-1.5">
                <h4 className="font-extrabold text-neutral-950 text-sm tracking-tight">Privilégio Exclusivo</h4>
                <p className="text-xs text-neutral-500 leading-relaxed font-medium">
                  {actionWarning.message}
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2 text-xs font-bold">
                {actionWarning.type === "sos" ? (
                  <button
                    onClick={() => {
                      setActionWarning(null);
                      setShowSignUpModal("empreendedor");
                    }}
                    className="p-3 bg-brand-red text-white hover:bg-brand-red/90 rounded-full transition-all cursor-pointer border-none uppercase tracking-wide text-[11px]"
                  >
                    Criar Perfil de Empreendedor
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActionWarning(null);
                      setShowSignUpModal("fornecedor");
                    }}
                    className="p-3 bg-brand-charcoal text-white hover:bg-brand-charcoal/90 rounded-full transition-all cursor-pointer border-none uppercase tracking-wide text-[11px]"
                  >
                    Criar Perfil de Fornecedor
                  </button>
                )}
                
                <button
                  onClick={() => setActionWarning(null)}
                  className="p-2.5 bg-neutral-200 text-neutral-650 hover:bg-neutral-300 hover:text-neutral-800 rounded-full cursor-pointer border-none uppercase tracking-wide text-[10px]"
                >
                  Continuar Buscando Fornecedores
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
