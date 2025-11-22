import React from 'react';

// Define the Menu type
interface Menu {
    _id: string;
    name: string;
    description: string;
    price: number;
}

interface MenuDetailProps {
    menu: Menu;
}

const MenuDetail: React.FC<MenuDetailProps> = ({ menu }) => {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{menu.name}</h1>
                    <p className="text-gray-600 leading-relaxed">{menu.description}</p>
                    <h2 className="text-xl font-semibold text-orange-600 mt-4">Price: ₹{menu.price}</h2>
                </div>
            </div>
        </div>
    );
};

export default MenuDetail;