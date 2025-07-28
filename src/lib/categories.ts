import { Code, Palette, PenTool, Home, FileText } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: any;
  color?: string;
  examples?: string[];
}

// קטגוריות ברירת מחדל
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'programming',
    name: 'תכנות',
    description: 'פיתוח קוד, דיבאג ובניית אפליקציות עם סיוע AI',
    icon: Code,
    color: 'from-blue-600 to-purple-600',
    examples: ['פיתוח React', 'סקריפטים Python', 'שאילתות מסד נתונים', 'אינטגרציית API']
  },
  {
    id: 'architecture',
    name: 'אדריכלות ועיצוב פנים',
    description: 'עיצוב חללים, תכנון פריסות ויצירת פתרונות אדריכליים',
    icon: Home,
    color: 'from-green-600 to-teal-600',
    examples: ['תכניות קומה', 'עיצוב פנים', 'מידול תלת מימד', 'בחירת חומרים']
  },
  {
    id: 'writing',
    name: 'תמלול וניתוח',
    description: 'תמלול אודיו ווידאו, ניתוח תוכן וסיכום מסמכים',
    icon: PenTool,
    color: 'from-orange-600 to-red-600',
    examples: ['תמלול הקלטות', 'ניתוח טקסטים', 'סיכום מסמכים', 'הכנת דוחות']
  },
  {
    id: 'design',
    name: 'גרפיקה ועיצוב',
    description: 'יצירת תוכן ויזואלי, לוגואים ואמנות דיגיטלית',
    icon: Palette,
    color: 'from-pink-600 to-purple-600',
    examples: ['עיצוב לוגו', 'עיצוב UI/UX', 'זהות מותג', 'איורים דיגיטליים']
  },
  {
    id: 'copywriting',
    name: 'ניסוח ושכתוב',
    description: 'שכתוב טקסטים, שיפור ניסוח ויצירת תוכן מרתק',
    icon: FileText,
    color: 'from-indigo-600 to-blue-600',
    examples: ['שכתוב מאמרים', 'ניסוח מכתבים', 'תוכן שיווקי', 'עריכה לשונית']
  }
];

// מחזיר את הקטגוריות מה-localStorage או מברירת המחדל
export const getCategories = (): Category[] => {
  try {
    const savedSettings = localStorage.getItem('bot_admin_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      if (settings.categories && Array.isArray(settings.categories)) {
        // ממיר את הקטגוריות מה-localStorage לפורמט המלא
        return settings.categories.map((categoryName: string, index: number) => {
          const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.name === categoryName);
          if (defaultCategory) {
            return defaultCategory;
          }
          // אם זה קטגוריה חדשה, יוצר אותה עם נתונים בסיסיים
          return {
            id: `custom-${index}`,
            name: categoryName,
            description: `מומחה ${categoryName}`,
            icon: Code, // אייקון ברירת מחדל
            color: 'from-gray-600 to-gray-700',
            examples: [`עבודה ב${categoryName}`]
          };
        });
      }
    }
  } catch (error) {
    console.error('Error loading categories from localStorage:', error);
  }
  
  return DEFAULT_CATEGORIES;
};

// שומר קטגוריות ב-localStorage
export const saveCategories = (categories: string[]) => {
  try {
    const savedSettings = localStorage.getItem('bot_admin_settings');
    let settings = {};
    
    if (savedSettings) {
      settings = JSON.parse(savedSettings);
    }
    
    const updatedSettings = {
      ...settings,
      categories
    };
    
    localStorage.setItem('bot_admin_settings', JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Error saving categories to localStorage:', error);
  }
};

// מחזיר רק את שמות הקטגוריות
export const getCategoryNames = (): string[] => {
  return getCategories().map(cat => cat.name);
};