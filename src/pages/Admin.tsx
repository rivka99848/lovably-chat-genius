
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  messageLimit: number;
  features: string[];
  isActive: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, messageLimit: 0, features: [''] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load categories from localStorage
    const savedCategories = localStorage.getItem('admin_categories');
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Default categories
      const defaultCategories: Category[] = [
        { id: '1', name: 'תכנות', description: 'פיתוח תוכנה ותכנות', isActive: true },
        { id: '2', name: 'עיצוב', description: 'עיצוב גרפי ו-UI/UX', isActive: true },
        { id: '3', name: 'שיווק', description: 'שיווק דיגיטלי ומכירות', isActive: true },
        { id: '4', name: 'כספים', description: 'ייעוץ כלכלי וחשבונאות', isActive: true }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('admin_categories', JSON.stringify(defaultCategories));
    }

    // Load pricing plans from localStorage
    const savedPlans = localStorage.getItem('admin_pricing_plans');
    if (savedPlans) {
      setPricingPlans(JSON.parse(savedPlans));
    } else {
      // Default pricing plans
      const defaultPlans: PricingPlan[] = [
        {
          id: '1',
          name: 'חינם',
          price: 0,
          messageLimit: 50,
          features: ['50 הודעות בחודש', 'תמיכה בסיסית'],
          isActive: true
        },
        {
          id: '2',
          name: 'פרו',
          price: 29,
          messageLimit: 500,
          features: ['500 הודעות בחודש', 'תמיכה מועדפת', 'העלאת קבצים'],
          isActive: true
        },
        {
          id: '3',
          name: 'ארגוני',
          price: 99,
          messageLimit: 2000,
          features: ['2000 הודעות בחודש', 'תמיכה 24/7', 'העלאת קבצים', 'API גישה'],
          isActive: true
        }
      ];
      setPricingPlans(defaultPlans);
      localStorage.setItem('admin_pricing_plans', JSON.stringify(defaultPlans));
    }
  };

  const saveCategories = (updatedCategories: Category[]) => {
    setCategories(updatedCategories);
    localStorage.setItem('admin_categories', JSON.stringify(updatedCategories));
  };

  const savePricingPlans = (updatedPlans: PricingPlan[]) => {
    setPricingPlans(updatedPlans);
    localStorage.setItem('admin_pricing_plans', JSON.stringify(updatedPlans));
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם קטגוריה",
        variant: "destructive"
      });
      return;
    }

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      isActive: true
    };

    const updatedCategories = [...categories, category];
    saveCategories(updatedCategories);
    setNewCategory({ name: '', description: '' });
    
    toast({
      title: "הצלחה",
      description: "הקטגוריה נוספה בהצלחה"
    });
  };

  const updateCategory = (category: Category) => {
    const updatedCategories = categories.map(c => 
      c.id === category.id ? category : c
    );
    saveCategories(updatedCategories);
    setEditingCategory(null);
    
    toast({
      title: "הצלחה",
      description: "הקטגוריה עודכנה בהצלחה"
    });
  };

  const deleteCategory = (id: string) => {
    const updatedCategories = categories.filter(c => c.id !== id);
    saveCategories(updatedCategories);
    
    toast({
      title: "הצלחה",
      description: "הקטגוריה נמחקה בהצלחה"
    });
  };

  const addPricingPlan = () => {
    if (!newPlan.name.trim()) {
      toast({
        title: "שגיאה",
        description: "יש להזין שם תוכנית",
        variant: "destructive"
      });
      return;
    }

    const plan: PricingPlan = {
      id: Date.now().toString(),
      name: newPlan.name,
      price: newPlan.price,
      messageLimit: newPlan.messageLimit,
      features: newPlan.features.filter(f => f.trim()),
      isActive: true
    };

    const updatedPlans = [...pricingPlans, plan];
    savePricingPlans(updatedPlans);
    setNewPlan({ name: '', price: 0, messageLimit: 0, features: [''] });
    
    toast({
      title: "הצלחה",
      description: "תוכנית התמחור נוספה בהצלחה"
    });
  };

  const updatePricingPlan = (plan: PricingPlan) => {
    const updatedPlans = pricingPlans.map(p => 
      p.id === plan.id ? plan : p
    );
    savePricingPlans(updatedPlans);
    setEditingPlan(null);
    
    toast({
      title: "הצלחה",
      description: "תוכנית התמחור עודכנה בהצלחה"
    });
  };

  const deletePricingPlan = (id: string) => {
    const updatedPlans = pricingPlans.filter(p => p.id !== id);
    savePricingPlans(updatedPlans);
    
    toast({
      title: "הצלחה",
      description: "תוכנית התמחור נמחקה בהצלחה"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              חזרה לאתר
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              ממשק ניהול מנהל
            </h1>
          </div>
        </div>

        {/* Categories Management */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl mb-8">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">ניהול קטגוריות</h2>
            
            {/* Add New Category */}
            <div className="bg-white/5 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">הוספת קטגוריה חדשה</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="שם הקטגוריה"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Input
                  placeholder="תיאור הקטגוריה"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Button onClick={addCategory} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף קטגוריה
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
                  {editingCategory?.id === category.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                      <Input
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Input
                        value={editingCategory.description}
                        onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <h4 className="text-lg font-semibold">{category.name}</h4>
                        <Badge className={category.isActive ? "bg-green-600" : "bg-red-600"}>
                          {category.isActive ? "פעיל" : "מושבת"}
                        </Badge>
                      </div>
                      <p className="text-white/70 mt-1">{category.description}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 space-x-reverse">
                    {editingCategory?.id === category.id ? (
                      <>
                        <Button
                          onClick={() => updateCategory(editingCategory)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditingCategory(null)}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => setEditingCategory(category)}
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => deleteCategory(category.id)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Pricing Plans Management */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-white">ניהול תוכניות תמחור</h2>
            
            {/* Add New Pricing Plan */}
            <div className="bg-white/5 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold mb-4">הוספת תוכנית תמחור חדשה</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Input
                  placeholder="שם התוכנית"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Input
                  type="number"
                  placeholder="מחיר (₪)"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: parseInt(e.target.value) || 0})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Input
                  type="number"
                  placeholder="מגבלת הודעות"
                  value={newPlan.messageLimit}
                  onChange={(e) => setNewPlan({...newPlan, messageLimit: parseInt(e.target.value) || 0})}
                  className="bg-white/10 border-white/20 text-white placeholder-white/50"
                />
                <Button onClick={addPricingPlan} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף תוכנית
                </Button>
              </div>
              <div className="space-y-2">
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="flex space-x-2 space-x-reverse">
                    <Input
                      placeholder={`תכונה ${index + 1}`}
                      value={feature}
                      onChange={(e) => {
                        const updatedFeatures = [...newPlan.features];
                        updatedFeatures[index] = e.target.value;
                        setNewPlan({...newPlan, features: updatedFeatures});
                      }}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    {index === newPlan.features.length - 1 && (
                      <Button
                        onClick={() => setNewPlan({...newPlan, features: [...newPlan.features, '']})}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <Card key={plan.id} className="bg-white/5 border-white/10">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold">{plan.name}</h4>
                      <Badge className={plan.isActive ? "bg-green-600" : "bg-red-600"}>
                        {plan.isActive ? "פעיל" : "מושבת"}
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold mb-2">₪{plan.price}</div>
                    <div className="text-sm text-white/70 mb-4">{plan.messageLimit} הודעות בחודש</div>
                    <ul className="space-y-1 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-white/80">• {feature}</li>
                      ))}
                    </ul>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        onClick={() => setEditingPlan(plan)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => deletePricingPlan(plan.id)}
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
