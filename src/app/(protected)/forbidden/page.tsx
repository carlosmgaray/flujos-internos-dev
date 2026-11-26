import { RedirectButton } from './ui/redirect-button';

export default function ForbiddenPage() {
    return (
        <div className="w-full max-h-full h-full">
            <div className="max-w-screen-2xl mx-auto w-full px-10 h-full rounded-md flex flex-col justify-center items-center max-h-full overflow-auto"> {/* UNCLEAR-TRANSCRIPTION */}
                <h1 className="title-size mb-8 text-center">
                    Você NÃO possui as credenciais necessárias para acessar esta página.
                </h1>
                <RedirectButton />
            </div>
        </div>
    );
}
