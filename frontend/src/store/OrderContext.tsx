import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { OrderItem } from '../pages/POS/OrderDetails';
import { getOrders, createOrder, updateOrderStatus as apiUpdateOrderStatus } from '../api';
import { socket } from '../socket';

export interface FullOrder {
  id: number;
  order_id: string;
  token_number: number;
  customer_name: string;
  customer_phone: string;
  customer_id: string;
  items: OrderItem[];
  total_bill: number;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Completed';
  payment_method?: 'Cash' | 'Card' | 'UPI';
  chef_name?: string;
  generated_coupon?: string;
  table_number?: number;
  created_at: string;
}

export interface Coupon {
  code: string;
  isUsed: boolean;
}

export interface Table {
  number: number;
  status: 'Available' | 'Reserved' | 'On Hold';
}

interface OrderContextType {
  orders: FullOrder[];
  tables: Table[];
  addOrder: (order: Omit<FullOrder, 'id' | 'order_id' | 'token_number' | 'status' | 'created_at' | 'customer_id'>) => Promise<number>;
  updateOrderStatus: (id: number, status: FullOrder['status'], chef_name?: string) => Promise<void>;
  updateOrderTable: (orderId: number, tableNumber: number) => void;
  validateAndUseCoupon: (code: string) => boolean;
  generateCoupon: () => string;
  holdTable: (tableNumber: number) => void;
  reserveTable: (tableNumber: number) => void;
  freeTable: (tableNumber: number) => void;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Generate 12 initial tables
const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  number: i + 1,
  status: 'Available'
}));

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [coupons, setCoupons] = useState<Record<string, Coupon>>({});

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      // Map backend response to FullOrder format
      const mappedOrders: FullOrder[] = data.map((o: any) => ({
        id: o.id,
        order_id: o.name || `ORD-${o.id}`,
        token_number: o.id,
        customer_name: o.partner?.name || 'Walk-in',
        customer_phone: o.partner?.phone || '',
        customer_id: o.partner_id ? String(o.partner_id) : '',
        items: o.lines?.map((l: any) => ({
          id: l.id,
          product_id: l.product_id,
          name: l.product?.name,
          price: l.price_unit,
          qty: l.qty,
          status: l.state_kitchen
        })) || [],
        total_bill: o.amount_total,
        status: o.state,
        payment_method: o.payment_method,
        generated_coupon: o.generated_coupon,
        table_number: o.table_id ? parseInt(o.table?.name || '0') : undefined,
        created_at: o.date_order
      }));
      setOrders(mappedOrders.reverse());
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    socket.connect();

    socket.on('new_kitchen_order', () => {
      fetchOrders();
    });

    socket.on('order_updated', () => {
      fetchOrders();
    });

    return () => {
      socket.off('new_kitchen_order');
      socket.off('order_updated');
    };
  }, []);

  const holdTable = (tableNumber: number) => {
    setTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'On Hold' } : t));
  };

  const reserveTable = (tableNumber: number) => {
    setTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'Reserved' } : t));
  };

  const freeTable = (tableNumber: number) => {
    setTables(prev => prev.map(t => t.number === tableNumber ? { ...t, status: 'Available' } : t));
  };

  const validateAndUseCoupon = (code: string): boolean => {
    const coupon = coupons[code];
    if (coupon && !coupon.isUsed) {
      setCoupons(prev => ({
        ...prev,
        [code]: { ...coupon, isUsed: true }
      }));
      return true;
    }
    return false;
  };

  const generateCoupon = (): string => {
    const code = `SAVE10-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    setCoupons(prev => ({
      ...prev,
      [code]: { code, isUsed: false }
    }));
    return code;
  };

  const addOrder = async (orderData: Omit<FullOrder, 'id' | 'order_id' | 'token_number' | 'status' | 'created_at' | 'customer_id'>): Promise<number> => {
    const orderPayload = {
      name: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      table_id: orderData.table_number, // We might need to map table_number to table_id
      customer_name: orderData.customer_name,
      customer_phone: orderData.customer_phone,
      state: 'Pending',
      amount_total: orderData.total_bill,
      payment_method: orderData.payment_method,
      generated_coupon: orderData.generated_coupon,
      lines: orderData.items.map(item => ({
        product_id: item.product_id,
        qty: item.qty,
        price_unit: item.price,
        price_subtotal: item.price * item.qty,
        state_kitchen: 'To Cook'
      }))
    };

    try {
      const res = await createOrder(orderPayload);
      await fetchOrders();
      return res.id;
    } catch (err) {
      console.error("Failed to create order", err);
      return 0;
    }
  };

  const updateOrderStatus = async (id: number, status: FullOrder['status'], _chef_name?: string) => {
    try {
      await apiUpdateOrderStatus(id, status);
      await fetchOrders();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const updateOrderTable = (id: number, tableNumber: number) => {
    // Left empty or we can add an API endpoint for it
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, table_number: tableNumber } : o)
    );
  };

  return (
    <OrderContext.Provider value={{ orders, tables, addOrder, updateOrderStatus, updateOrderTable, validateAndUseCoupon, generateCoupon, holdTable, reserveTable, freeTable, refreshOrders: fetchOrders }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};
