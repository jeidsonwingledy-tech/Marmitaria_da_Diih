import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const Location = () => {
  const { restaurantInfo } = useStore();

  return (
    <div className="p-0">
      <div className="w-full h-64 bg-gray-200">
        <iframe 
          title="Map"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight={0} 
          marginWidth={0} 
          src="https://maps.google.com/maps?q=Restaurante&t=&z=13&ie=UTF8&iwloc=&output=embed"
          className="w-full h-full opacity-80"
        ></iframe>
      </div>
      
      <div className="p-6 -mt-6 bg-white rounded-t-3xl relative z-10">
        <h2 className="text-2xl font-bold mb-6">Onde estamos</h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-full text-primary mt-1">
              <MapPin size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Endereço</h3>
              <p className="text-gray-600">{restaurantInfo.address}</p>
              <p className="text-gray-500 text-sm mt-1">Próximo à praça central</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-full text-primary mt-1">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Horário de Atendimento</h3>
              <div className="space-y-1 text-gray-600 whitespace-pre-line">
                {restaurantInfo.businessHours || "Segunda - Sábado: 10:30 - 14:30"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-full text-primary mt-1">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Contato</h3>
              <p className="text-gray-600">{restaurantInfo.phone}</p>
              <a href={`https://wa.me/${restaurantInfo.whatsappNumber}`} className="text-primary font-medium text-sm mt-1 block">
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;