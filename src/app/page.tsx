"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { MarketplaceHero } from "@/components/MarketplaceHero";
import { SearchFilters } from "@/components/SearchFilters";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { AppFooter } from "@/components/AppFooter";
import { Pagination } from "@/components/Pagination";
import { ChatInterface } from "@/components/ChatInterface";

interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  imageUrl?: string;
  sellerId?: string;
  availableQuantity?: string;
  seller: {
    id: string;
    name: string;
    userType: string;
    location: string;
    verified?: boolean;
    phoneVerified?: boolean;
    verificationStatus?: string;
    accountType?: string;
  };
  createdAt: string;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [activeChats, setActiveChats] = useState<any[]>([]); // Array of active chat popups
  const router = useRouter();

  useEffect(() => {
    // Start loading products immediately
    loadProducts();
    
    // Add global event listener for chat popup
    const handleOpenChatEvent = (event: CustomEvent) => {
      const { userId, userName, productId, productName, conversationId } = event.detail;
      
      // Check if chat is already open
      const existingChat = activeChats.find(chat => 
        chat.otherPartyId === userId && chat.productId === productId
      );
      
      if (existingChat) {
        // Chat already open, bring it to front (you could implement this later)
        return;
      }

      // Create new chat popup
      const newChat = {
        id: conversationId || `chat_${userId}_${productId}_${Date.now()}`,
        otherPartyId: userId,
        otherPartyName: userName,
        otherPartyType: 'user', // Default type
        otherPartyLocation: '',
        otherPartyRating: 0,
        productName: productName,
        productId: productId,
        otherPartyVerified: false,
        otherPartyProfileImage: '',
        otherPartyVerificationStatus: {
          trustLevel: 'unverified',
          tierLabel: 'Unverified',
          levelBadge: '!'
        },
        // Add basic product data for offer button logic
        product: {
          id: productId,
          name: productName,
          price: 0, // Will be updated when product data is loaded
          unit: 'units',
          image: '',
          sellerId: userId,
          availableQuantity: '0' // Will be updated when product data is loaded
        }
      };

      setActiveChats(prev => [...prev, newChat]);
    };

    // Add event listener
    window.addEventListener('openChat', handleOpenChatEvent as EventListener);

    // Listen for offer status changes to refresh available quantities
    const handleOfferStatusChange = (event: CustomEvent) => {
      console.log('🔄 Offer status changed, refreshing marketplace...', event.detail);
      loadProducts();
    };
    window.addEventListener('offerStatusChanged', handleOfferStatusChange as EventListener);

    // Check for existing user session (non-blocking)
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (token && userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    // Cleanup function
    return () => {
      window.removeEventListener('openChat', handleOpenChatEvent as EventListener);
      window.removeEventListener('offerStatusChanged', handleOfferStatusChange as EventListener);
    };
  }, []);

  // Filter out current user's products when both products and currentUser are available
  useEffect(() => {
    if (products.length > 0) {
      if (currentUser?.id) {
        // Filter out current user's own products
        const filtered = products.filter(product => product.sellerId !== currentUser.id);
        setFilteredProducts(filtered);
      } else {
        // No current user, show all products
        setFilteredProducts(products);
      }
    }
  }, [products, currentUser]);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        // Don't set filteredProducts here - let useEffect handle it
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    router.push("/");
  };

  const handleBackToMarketplace = () => {
    router.push("/");
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToRegister = () => {
    router.push("/register");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  const handleViewMessages = () => {
    router.push("/messages");
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  const handleEditProfile = () => {
    router.push("/profile?edit=true");
  };

  const handleShowVerification = () => {
    router.push("/verify");
  };

  const handleViewStorefront = (sellerId: string) => {
    router.push(`/seller/${sellerId}`);
  };

  // Chat popup handlers
  const handleOpenChat = (sellerId: string, productId: string) => {
    // Find the product and seller info
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if chat is already open
    const existingChat = activeChats.find(chat => 
      chat.otherPartyId === sellerId && chat.productId === productId
    );
    
    if (existingChat) {
      // Chat already open, bring it to front (you could implement this later)
      return;
    }

    // Create new chat popup
    const newChat = {
      id: `chat_${sellerId}_${productId}_${Date.now()}`,
      otherPartyId: sellerId,
      otherPartyName: product.seller.name,
      otherPartyType: product.seller.userType,
      otherPartyAccountType: product.seller.accountType || 'individual',
      otherPartyLocation: product.seller.location,
      otherPartyRating: 0, // We don't have rating in product data
      productName: product.name,
      productId: productId,
      otherPartyVerified: product.seller.verified || false,
      otherPartyProfileImage: (product.seller as any).profileImage || '',
      otherPartyVerificationStatus: {
        trustLevel: product.seller.verified ? 'id-verified' : 'unverified',
        tierLabel: product.seller.verified ? 'Verified' : 'Unverified',
        levelBadge: product.seller.verified ? '✓' : '!'
      },
      // Add complete product data for offer button logic
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        image: product.imageUrl,
        sellerId: product.seller.id,
        availableQuantity: (product as any).availableQuantity || '0',
        seller: product.seller
      }
    };

    setActiveChats(prev => [...prev, newChat]);
  };

  const handleCloseChat = (chatId: string) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  const handleShowAdminVerification = () => {
    router.push("/admin");
  };

  const handleUpdateUser = (updates: any) => {
    // This would typically update the user context
    console.log("Update user:", updates);
  };

  const handleFilterChange = useCallback((filteredProducts: Product[]) => {
    setFilteredProducts(filteredProducts);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        currentUser={currentUser}
        onLogout={handleLogout}
      />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <MarketplaceHero 
          currentUser={currentUser}
          allProducts={isLoading ? [] : products}
        />
        
        <div className="mt-6">
          <SearchFilters 
            products={products}
            onFilterChange={handleFilterChange}
            currentUser={currentUser}
          />
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : (() => {
          // Calculate pagination
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const currentProducts = filteredProducts.slice(startIndex, endIndex);

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currentUser={currentUser}
                onProductClick={(productId) => router.push(`/product/${productId}`)}
                onSellerClick={(sellerId) => router.push(`/seller/${sellerId}`)}
                onChatClick={(sellerId) => handleOpenChat(sellerId, product.id)}
                onOfferClick={(productId) => {
                  // Handle offer click
                  console.log("Make offer for product:", productId);
                }}
              />
              ))}
            </div>
          );
        })()}
        
        {filteredProducts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-600">No products found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {filteredProducts.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredProducts.length / itemsPerPage)}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Chat Popups - Facebook Style */}
      {activeChats.map((chat, index) => (
        <div
          key={chat.id}
          className="fixed bottom-4 right-4 z-50"
          style={{ 
            right: `${16 + (index * 400)}px`, // Stack chats horizontally
            bottom: '16px'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
              otherPartyName={chat.otherPartyName}
              otherPartyType={chat.otherPartyType}
              otherPartyAccountType={chat.otherPartyAccountType || 'individual'}
              otherPartyLocation={chat.otherPartyLocation}
              otherPartyRating={chat.otherPartyRating}
              productName={chat.productName}
              productId={chat.productId}
              otherPartyId={chat.otherPartyId}
              onClose={() => handleCloseChat(chat.id)}
              otherPartyVerified={chat.otherPartyVerified}
              otherPartyProfileImage={chat.otherPartyProfileImage}
              otherPartyVerificationStatus={chat.otherPartyVerificationStatus}
              product={chat.product}
              currentUser={currentUser}
            />
          </div>
        </div>
      ))}
    </div>
  );
}