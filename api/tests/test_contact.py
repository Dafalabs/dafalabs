import pytest

from app import mail_service
from app.database import SessionLocal
from app.models import ContactMessage
from app.schemas import ContactForm

GECERLI_FORM = {
    "name": "Ayşe Yılmaz",
    "email": "ayse@example.com",
    "subject": "Mobil uygulama",
    "message": "Merhaba, bir uygulama yaptırmak istiyorum.",
}


def test_health(client):
    assert client.get("/health").status_code == 200


def test_site_icerigi_bos_baslar(client):
    data = client.get("/site").json()
    assert data["contact"]["email"]
    assert data["projects"] == []


def test_projeler_veritabanindan_geliyor(client, projeler):
    data = client.get("/site").json()

    assert [p["id"] for p in data["projects"]] == ["ornek-bir", "ornek-iki"]
    assert data["projects"][0]["tr"]["title"] == "Örnek Bir"
    assert data["projects"][0]["url"] == "https://ornek.com/bir"
    assert data["projects"][0]["image_url"] == "/media/ornek-bir.jpg"
    assert data["projects"][1]["image_url"] is None
    assert data["projects"][1]["url"] is None


def test_yayinda_olmayan_proje_gizli(client, projeler):
    data = client.get("/site").json()
    assert all(p["id"] != "gizli" for p in data["projects"])



def test_gecerli_form_kaydediliyor(client):
    yanit = client.post("/iletisim", json=GECERLI_FORM)
    assert yanit.status_code == 202

    kod = yanit.json()["tracking_code"]
    assert kod.startswith("DL-")

    session = SessionLocal()
    kayit = session.query(ContactMessage).filter_by(tracking_code=kod).one()
    assert kayit.email == "ayse@example.com"
    assert kayit.status == "received"
    session.close()


def test_bildirim_ve_otomatik_cevap_gidiyor(client):
    client.post("/iletisim", json=GECERLI_FORM)
    assert len(client.sent["notifications"]) == 1
    assert len(client.sent["replies"]) == 1

    _, kod = client.sent["replies"][0]
    assert kod.startswith("DL-")


def test_ayni_adrese_otomatik_cevap_sinirli(client):
    for _ in range(4):
        client.post("/iletisim", json=GECERLI_FORM)

    assert len(client.sent["notifications"]) == 4
    assert len(client.sent["replies"]) == 2


def test_bot_tuzagi_kayit_acmiyor(client):
    yanit = client.post("/iletisim", json={**GECERLI_FORM, "website": "http://spam"})
    assert yanit.status_code == 202
    assert yanit.json()["tracking_code"] is None

    session = SessionLocal()
    assert session.query(ContactMessage).count() == 0
    session.close()


@pytest.mark.parametrize(
    "bozuk",
    [{"email": "gecersiz"}, {"message": "kısa"}, {"name": "x"}],
)
def test_gecersiz_veri_reddedilir(client, bozuk):
    assert client.post("/iletisim", json={**GECERLI_FORM, **bozuk}).status_code == 422


def test_takip_sorgusu(client):
    kod = client.post("/iletisim", json=GECERLI_FORM).json()["tracking_code"]

    yanit = client.get(f"/takip/{kod}")
    assert yanit.status_code == 200
    assert yanit.json()["status"] == "received"

    assert client.get(f"/takip/{kod.lower()}").status_code == 200
    assert client.get("/takip/DL-YOKK-0000").status_code == 404


def test_takip_mesaj_icerigi_sizdirmiyor(client):
    kod = client.post("/iletisim", json=GECERLI_FORM).json()["tracking_code"]
    govde = client.get(f"/takip/{kod}").json()

    assert "message" not in govde
    assert "email" not in govde
    assert "Merhaba" not in str(govde)


def test_bildirim_maili():
    mesaj = mail_service._build_notification(ContactForm(**GECERLI_FORM), "DL-AAAA-1111")
    duz = mesaj.get_body(preferencelist=("plain",)).get_content()
    html = mesaj.get_body(preferencelist=("html",)).get_content()

    assert "noreply@dafalabs.com" in mesaj["From"]
    assert "ayse@example.com" in mesaj["Reply-To"]
    assert "DL-AAAA-1111" in duz
    assert "Merhaba, bir uygulama" in duz
    assert "Merhaba, bir uygulama" in html
    assert "#e0a33c" in html


def test_otomatik_cevap_turkce():
    mesaj = mail_service._build_auto_reply(ContactForm(**GECERLI_FORM), "DL-BBBB-2222")
    duz = mesaj.get_body(preferencelist=("plain",)).get_content()
    html = mesaj.get_body(preferencelist=("html",)).get_content()

    assert "ayse@example.com" in mesaj["To"]
    assert mesaj["Auto-Submitted"] == "auto-replied"
    assert mesaj["Subject"] == "Mesajınızı aldık — dafalabs"
    assert "DL-BBBB-2222" in duz
    assert "DL-BBBB-2222" in html
    assert "/tr/takip" in html


def test_otomatik_cevap_ingilizce():
    form = ContactForm(**{**GECERLI_FORM, "locale": "en"})
    mesaj = mail_service._build_auto_reply(form, "DL-CCCC-3333")
    html = mesaj.get_body(preferencelist=("html",)).get_content()

    assert mesaj["Subject"] == "We received your message — dafalabs"
    assert "/en/tracking" in html
    assert "Check status" in html


def test_mail_hem_duz_metin_hem_html_iceriyor():
    mesaj = mail_service._build_auto_reply(ContactForm(**GECERLI_FORM), "DL-DDDD-4444")
    turler = {part.get_content_type() for part in mesaj.walk()}

    assert "text/plain" in turler
    assert "text/html" in turler


def test_gonderenin_dili_kaydediliyor(client):
    from app.database import SessionLocal
    from app.models import ContactMessage

    kod = client.post("/iletisim", json={**GECERLI_FORM, "locale": "en"}).json()["tracking_code"]

    session = SessionLocal()
    kayit = session.query(ContactMessage).filter_by(tracking_code=kod).one()
    assert kayit.locale == "en"
    session.close()


def test_ayarlar_veritabanindan_geliyor(client):
    from app.database import SessionLocal
    from app.models import Setting

    session = SessionLocal()
    session.add(Setting(key="email", value="db@dafalabs.com"))
    session.add(Setting(key="social_github", value="https://github.com/dafalabs"))
    session.commit()
    session.close()

    contact = client.get("/site").json()["contact"]

    assert contact["email"] == "db@dafalabs.com"
    assert contact["socials"] == [
        {"name": "GitHub", "href": "https://github.com/dafalabs"}
    ]


def test_ayar_yoksa_varsayilan_kullaniliyor(client):
    contact = client.get("/site").json()["contact"]
    assert contact["email"] == "hello@dafalabs.com"
    assert contact["location"] is None
    assert contact["socials"] == []


def test_durum_degeri_takipte_gorunuyor(client):
    from app.database import SessionLocal
    from app.models import ContactMessage

    kod = client.post("/iletisim", json=GECERLI_FORM).json()["tracking_code"]

    session = SessionLocal()
    kayit = session.query(ContactMessage).filter_by(tracking_code=kod).one()
    kayit.status = "reviewing"
    session.commit()
    session.close()

    assert client.get(f"/takip/{kod}").json()["status"] == "reviewing"
