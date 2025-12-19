// src/components/admin/Card.jsx
const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
    <h2 className="text-sm font-semibold text-slate-800 mb-2">{title}</h2>
    {children}
  </div>
);

export default Card;
