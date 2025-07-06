
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, X, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  description: string;
  examples: string[];
  color: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  messageLimit: number;
}

const Admin = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load existing categories and pricing from localStorage or set defaults
    const savedCategories = localStorage.getItem('admin_categories');
    const savedPlans = localStorage.getItem('admin_pricing');

    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    } else {
      // Default categories
      setCategories([
        {
          id: 'programming',
          name: 'תכנות',
          description: 'פיתוח קוד, דיבאג ובניית אפליקציות עם סיוע AI',
          examples: ['פיתוח React', 'סקריפטים Python', 'שאילתות מסד נתונים', 'אינטגרציית API'],
          color: 'from-blue-600 to-purple-600'
        },
        {
          id: 'architecture',
          name: 'אדריכלות ועיצוב פנים',
          description: 'עיצוב חללים, תכנון פריסות ויצירת פתרונות אדריכליים',
          examples: ['תכניות קומה', 'עיצוב פנים', 'מידול תלת מימד', 'בחירת חומרים'],
          color: 'from-green-600 to-teal-600'
        }
      ]);
    }

    if (savedPlans) {
      setPricingPlans(JSON.parse(savedPlans));
    } else {
      // Default pricing
      setPricingPlans([
        {
          id: 'free',
          name: 'Free',
          price: '$0',
          period: '/month',
          description: 'Perfect for getting started',
          features: ['50 messages per month', 'Access to all AI assistants', 'Basic chat history', 'Email support'],
          messageLimit: 50
        },
        {
          id: 'pro',
          name: 'Pro',
          price: '$19',
          period: '/month',
          description: 'Best for professionals',
          features: ['500 messages per month', 'Priority AI responses', 'Advanced code preview', 'Chat export & backup'],
          messageLimit: 500
        }
      ]);
    }
  }, []);

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem('admin_categories', JSON.stringify(newCategories));
  };

  const savePricingPlans = (newPlans: PricingPlan[]) => {
    setPricingPlans(newPlans);
    localStorage.setItem('admin_pricing', JSON.stringify(newPlans));
  };

  const handleSaveCategory = (category: Category) => {
    if (editingCategory) {
      const updated = categories.map(c => c.id === category.id ? category : c);
      saveCategories(updated);
    } else {
      saveCategories([...categories, { ...category, id: Date.now().toString() }]);
    }
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  const handleSavePlan = (plan: PricingPlan) => {
    if (editingPlan) {
      const updated = pricingPlans.map(p => p.id === plan.id ? plan : p);
      savePricingPlans(updated);
    } else {
      savePricingPlans([...pricingPlans, { ...plan, id: Date.now().toString() }]);
    }
    setEditingPlan(null);
    setIsAddingPlan(false);
  };

  const deleteCategory = (id: string) => {
    const filtered = categories.filter(c => c.id !== id);
    saveCategories(filtered);
  };

  const deletePlan = (id: string) => {
    const filtered = pricingPlans.filter(p => p.id !== id);
    savePricingPlans(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <Card className="p-8 bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-2">
                ממשק ניהול מערכת
              </h1>
              <p className="text-gray-600">
                ניהול קטגוריות ותמחור המערכת
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Categories Management */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">ניהול קטגוריות</h2>
              <Button onClick={() => setIsAddingCategory(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף קטגוריה
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="p-4 border-2 hover:border-green-200">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingCategory(category)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCategory(category.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{category.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {category.examples.map((example, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {example}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Pricing Management */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">ניהול תמחור</h2>
              <Button onClick={() => setIsAddingPlan(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                הוסף תוכנית
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <Card key={plan.id} className="p-4 border-2 hover:border-blue-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <div className="text-2xl font-bold text-gray-900">
                        {plan.price}<span className="text-sm text-gray-600">{plan.period}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deletePlan(plan.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="space-y-1">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="text-sm text-gray-700">• {feature}</div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Category Edit Modal */}
      {(editingCategory || isAddingCategory) && (
        <CategoryEditModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setEditingCategory(null);
            setIsAddingCategory(false);
          }}
        />
      )}

      {/* Plan Edit Modal */}
      {(editingPlan || isAddingPlan) && (
        <PlanEditModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => {
            setEditingPlan(null);
            setIsAddingPlan(false);
          }}
        />
      )}
    </div>
  );
};

// Category Edit Modal Component
const CategoryEditModal: React.FC<{
  category: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
}> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState<Category>(
    category || {
      id: '',
      name: '',
      description: '',
      examples: [''],
      color: 'from-blue-600 to-purple-600'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateExample = (index: number, value: string) => {
    const newExamples = [...formData.examples];
    newExamples[index] = value;
    setFormData({ ...formData, examples: newExamples });
  };

  const addExample = () => {
    setFormData({ ...formData, examples: [...formData.examples, ''] });
  };

  const removeExample = (index: number) => {
    const newExamples = formData.examples.filter((_, i) => i !== index);
    setFormData({ ...formData, examples: newExamples });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
      <Card className="p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">
          {category ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">שם הקטגוריה</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">תיאור</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label>דוגמאות</Label>
            {formData.examples.map((example, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={example}
                  onChange={(e) => updateExample(index, e.target.value)}
                  placeholder="דוגמה"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => removeExample(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addExample}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף דוגמה
            </Button>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 ml-2" />
              שמור
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Plan Edit Modal Component
const PlanEditModal: React.FC<{
  plan: PricingPlan | null;
  onSave: (plan: PricingPlan) => void;
  onClose: () => void;
}> = ({ plan, onSave, onClose }) => {
  const [formData, setFormData] = useState<PricingPlan>(
    plan || {
      id: '',
      name: '',
      price: '$0',
      period: '/month',
      description: '',
      features: [''],
      messageLimit: 50
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
      <Card className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">
          {plan ? 'עריכת תוכנית' : 'הוספת תוכנית חדשה'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="planName">שם התוכנית</Label>
            <Input
              id="planName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="price">מחיר</Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="period">תקופה</Label>
            <Input
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="planDescription">תיאור</Label>
            <Input
              id="planDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="messageLimit">מגבלת הודעות</Label>
            <Input
              id="messageLimit"
              type="number"
              value={formData.messageLimit}
              onChange={(e) => setFormData({ ...formData, messageLimit: parseInt(e.target.value) })}
              required
            />
          </div>
          
          <div>
            <Label>תכונות</Label>
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  placeholder="תכונה"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => removeFeature(index)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={addFeature}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף תכונה
            </Button>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              <Save className="w-4 h-4 ml-2" />
              שמור
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Admin;
