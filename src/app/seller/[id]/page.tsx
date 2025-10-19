"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/AppHeader";
import { SellerStorefront } from "@/components/SellerStorefront";
import { ChatInterface } from "@/components/ChatInterface";
import { ChevronLeft } from "lucide-react";

export default function SellerStorefrontPage() {
  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const sellerId = params.id as string;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }

    loadSellerData();
  }, [sellerId]);

  const loadSellerData = async () => {
    try {
      const [sellerResponse, productsResponse] = await Promise.all([
        fetch(`/api/user/${sellerId}/public`),
        fetch(`/api/products?sellerId=${sellerId}`)
      ]);

      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json();
        setSeller(sellerData.user);
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error("Error loading seller data:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const handleChat = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setIsChatOpen(true);
    }
  };

  // Check if current user is the storefront owner
  const isOwnStorefront = user && seller && user.id === seller.id;

  // Preview mode toggle handler
  const handleTogglePreviewMode = (mode: boolean) => {
    setPreviewMode(mode);
  };

  // Handle storefront image upload
  const handleEditStorefrontImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size must be less than 5MB');
        return;
      }

      try {
        // Convert to base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          
          // Update via API
          const token = localStorage.getItem('token');
          const requestBody = {
            storefrontImage: dataUrl
          };
          
          console.log('🖼️ Uploading storefront image:', {
            hasToken: !!token,
            dataUrlLength: dataUrl.length,
            dataUrlPreview: dataUrl.substring(0, 50) + '...'
          });
          
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(requestBody),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', response.status, errorText);
            throw new Error(`Failed to update storefront image: ${response.status}`);
          }

          const responseData = await response.json();
          console.log('✅ API Response:', responseData);

          // Update local state
          setSeller(prev => ({
            ...prev,
            storefrontImage: dataUrl
          }));

          alert('Storefront image updated successfully!');
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
    input.click();
  };

  // Handle storefront updates
  const handleUpdateStorefront = async (updates: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update storefront');
      }

      // Update local state
      setSeller(prev => ({
        ...prev,
        ...updates
      }));

      // Refresh seller data to get latest changes
      await loadSellerData();
    } catch (error) {
      console.error('Failed to update storefront:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading storefront...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Storefront not found</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader currentUser={user} onLogout={handleLogout} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <SellerStorefront
          seller={seller}
          products={products}
          onBack={() => router.push("/")}
          onViewProduct={(productId) => router.push(`/product/${productId}`)}
          onChat={handleChat}
          onEditProduct={(productId) => router.push(`/product/${productId}/edit`)}
          isOwnStorefront={isOwnStorefront}
          onEditStorefrontImage={handleEditStorefrontImage}
          onUpdateStorefront={handleUpdateStorefront}
          previewMode={previewMode}
          onTogglePreviewMode={handleTogglePreviewMode}
          currentUser={user}
        />
      </div>

      {/* Chat Popup */}
      {isChatOpen && selectedProduct && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col border border-gray-200">
            <ChatInterface
              otherPartyName={seller.name}
              otherPartyType={seller.userType}
              otherPartyAccountType={seller.accountType}
              otherPartyLocation={seller.location}
              otherPartyRating={seller.ratings?.rating || 0}
              productName={selectedProduct.name}
              productId={selectedProduct.id}
              otherPartyId={seller.id}
              onClose={() => {
                setIsChatOpen(false);
                setSelectedProduct(null);
              }}
              otherPartyVerified={seller.verified || false}
              currentUserVerified={user?.verified || false}
              currentUserType={user?.userType || 'buyer'}
              otherPartyProfileImage={seller.profileImage}
              otherPartyVerificationStatus={{
                trustLevel: seller.verified ? (seller.accountType === 'business' ? 'business-verified' : 'id-verified') : 'unverified',
                tierLabel: seller.verified ? (seller.accountType === 'business' ? 'Business ✓' : 'Verified') : 'Unverified',
                levelBadge: seller.verified ? (seller.accountType === 'business' ? '✓' : '✓') : '⚠'
              }}
              product={{
                id: selectedProduct.id,
                name: selectedProduct.name,
                price: selectedProduct.price,
                unit: selectedProduct.unit,
                image: selectedProduct.imageUrl
              }}
              currentUser={user}
            />
          </div>
        </div>
      )}
    </div>
  );
}