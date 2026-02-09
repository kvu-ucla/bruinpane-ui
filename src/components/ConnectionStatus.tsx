// import { Wifi, WifiOff } from 'lucide-react';
// import { useAuth } from '../AuthContext';
//
// export default function ConnectionStatus() {
//   const { isAuthenticated } = useAuth();
//   const host = import.meta.env.VITE_PLACEOS_HOST;
//
//   return (
//     <div className="flex items-center gap-2">
//       {isAuthenticated ? (
//         <div className="tooltip tooltip-left" data-tip={`Connected to ${host}`}>
//           <div className="badge badge-success gap-2">
//             <Wifi className="w-3 h-3" />
//             Connected
//           </div>
//         </div>
//       ) : (
//         <div className="tooltip tooltip-left" data-tip="Not authenticated">
//           <div className="badge badge-warning gap-2">
//             <WifiOff className="w-3 h-3" />
//             Disconnected
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
