export function AccessDeniedPage({ message }: { message: string }) {
  return (
    <main className="center-screen">
      <section className="dialog">
        <p className="eyebrow">Доступ не предоставлен</p>
        <h1>Аккаунт не входит в whitelist</h1>
        <p>{message}</p>
        <p>Обратитесь к администратору и сообщите свой GitHub login.</p>
      </section>
    </main>
  );
}
