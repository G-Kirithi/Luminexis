import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { OrderItem } from '../pages/POS/OrderDetails';

export interface FullOrder {
  id: number;
  order_id: string;
  token_number: number;
  customer_name: string;
  customer_phone: string;
  customer_id: string; // mapped from phone
  items: OrderItem[];
  total_bill: number;
  status: 'Pending' | 'Cooking' | 'Ready' | 'Completed';
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface OrderContextType {
  orders: FullOrder[];
  addOrder: (order: Omit<FullOrder, 'id' | 'order_id' | 'token_number' | 'status' | 'created_at' | 'customer_id'>) => void;
  updateOrderStatus: (id: number, status: FullOrder['status']) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useState<FullOrder[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({}); // Phone -> Customer

  const addOrder = (orderData: Omit<FullOrder, 'id' | 'order_id' | 'token_number' | 'status' | 'created_at' | 'customer_id'>) => {
    const newId = Date.now();
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const token = orders.length > 0 ? Math.max(...orders.map(o => o.token_number)) + 1 : 1;
    
    // Resolve Customer ID
    let customerId = '';
    if (customers[orderData.customer_phone]) {
      customerId = customers[orderData.customer_phone].id;
    } else {
      // New customer, generate ID
      customerId = `CUST-${Math.floor(10000 + Math.random() * 90000)}`;
      setCustomers(prev => ({
        ...prev,
        [orderData.customer_phone]: {
          id: customerId,
          name: orderData.customer_name,
          phone: orderData.customer_phone
        }
      }));
    }

    const newOrder: FullOrder = {
      ...orderData,
      customer_id: customerId,
      id: newId,
      order_id: orderNumber,
      token_number: token,
      status: 'Pending',
      created_at: new Date().toLocaleTimeString(),
    };

    setOrders(prev => [newOrder, ...prev]);
  };

  const updateOrderStatus = (id: number, status: FullOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  return (
    <OrderContext.Provider value={{ orders, addOrder, updateOrderStatus }}>
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
