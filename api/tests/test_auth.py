from app.security import COOKIE_NAME

GECERLI = {"email": "musteri@example.com", "password": "cokGizliParola1"}


def test_giris_yonlendirme_adresi_donuyor(client, user):
    yanit = client.post("/auth/login", json=GECERLI)

    assert yanit.status_code == 200
    govde = yanit.json()
    assert govde["redirect_url"] == "https://panel.dafalabs.com/musteri"
    assert govde["name"] == "Örnek Müşteri"
    assert COOKIE_NAME in yanit.cookies


def test_yanlis_parola_reddediliyor(client, user):
    yanit = client.post("/auth/login", json={**GECERLI, "password": "yanlisParola1"})
    assert yanit.status_code == 401
    assert COOKIE_NAME not in yanit.cookies


def test_olmayan_kullanici_ayni_hatayi_veriyor(client):
    yanit = client.post("/auth/login", json={"email": "yok@example.com", "password": "birParola1"})
    assert yanit.status_code == 401
    assert yanit.json()["detail"] == "Email or password is incorrect."


def test_pasif_kullanici_giremiyor(client, user):
    from app.database import SessionLocal
    from app.models import User

    session = SessionLocal()
    kayit = session.query(User).filter_by(email="musteri@example.com").one()
    kayit.is_active = False
    session.commit()
    session.close()

    assert client.post("/auth/login", json=GECERLI).status_code == 401


def test_oturum_bilgisi_okunuyor(client, user):
    client.post("/auth/login", json=GECERLI)

    yanit = client.get("/auth/me")
    assert yanit.status_code == 200
    assert yanit.json()["email"] == "musteri@example.com"


def test_oturumsuz_erisim_engelleniyor(client):
    assert client.get("/auth/me").status_code == 401


def test_cikis_oturumu_kapatiyor(client, user):
    client.post("/auth/login", json=GECERLI)
    client.post("/auth/logout")
    assert client.get("/auth/me").status_code == 401


def test_giris_denemesi_sinirlaniyor(client, user, monkeypatch):
    from app.routers import auth as auth_router

    monkeypatch.setattr(auth_router, "LOGIN_MAX", 3)

    for _ in range(3):
        client.post("/auth/login", json={**GECERLI, "password": "yanlisParola1"})

    assert client.post("/auth/login", json=GECERLI).status_code == 429


def test_parola_veritabaninda_duz_metin_degil(client, user):
    from app.database import SessionLocal
    from app.models import User

    session = SessionLocal()
    kayit = session.query(User).filter_by(email="musteri@example.com").one()
    assert "cokGizliParola1" not in kayit.password_hash
    assert kayit.password_hash.startswith("$2b$")
    session.close()
