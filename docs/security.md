# Sécurité — Stuff The VPN

## Principes

1. **Defense in depth** : Plusieurs couches de protection
2. **Zero trust** : Chaque requête est authentifiée et autorisée
3. **Least privilege** : Chaque rôle n'accède qu'à ce dont il a besoin
4. **Encryption at rest & in transit** : Toutes les données sensibles sont chiffrées

## Authentification

- Tokens JWT avec expiration courte (15 min) + refresh tokens (30 jours)
- Mots de passe hashés avec bcrypt (salt rounds : 12)
- Rate limiting sur les routes d'authentification (5 tentatives/min)

## Distribution des configurations VPN

Les configurations V2Ray et SSH contiennent des informations sensibles (clés, UUIDs).  
Elles sont :
- Générées côté serveur uniquement
- Chiffrées avant stockage en base de données
- Transmises via HTTPS uniquement
- Liées à l'appareil (fingerprint)

## Rôles et permissions

| Rôle       | Permissions                                           |
|------------|-------------------------------------------------------|
| `admin`    | Accès complet à toutes les ressources                 |
| `reseller` | Gestion de ses utilisateurs et vouchers uniquement    |
| `client`   | Accès à son profil, vouchers et configurations        |

## TODO (Phase 7)

- [ ] Audit de sécurité complet
- [ ] Pen testing
- [ ] Configuration Fail2Ban pour les serveurs VPN
- [ ] Monitoring des anomalies de trafic
- [ ] Politique de rétention des logs
