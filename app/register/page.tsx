import { redirect } from 'next/navigation';

export default function RegisterPage() {
    // The login page handles registration state internally, 
    // so we redirect direct /register hits to /login.
    redirect('/login');
}
