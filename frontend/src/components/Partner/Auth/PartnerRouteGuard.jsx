'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import styles from './PartnerRouteGuard.module.css';

const PARTNER_ROLE_SET = new Set(['ROLE_PARTNER', 'PARTNER', 'ROLE_HOST', 'HOST', 'ROLE_ADMIN', 'ADMIN']);

const collectRoles = (user) => {
  if (!user) return [];

  const values = [];

  if (typeof user.role === 'string') {
    values.push(user.role);
  }

  if (Array.isArray(user.roles)) {
    user.roles.forEach((roleItem) => {
      if (typeof roleItem === 'string') {
        values.push(roleItem);
      } else if (roleItem && typeof roleItem === 'object') {
        if (typeof roleItem.name === 'string') values.push(roleItem.name);
        if (typeof roleItem.role === 'string') values.push(roleItem.role);
        if (typeof roleItem.authority === 'string') values.push(roleItem.authority);
      }
    });
  }

  if (Array.isArray(user.authorities)) {
    user.authorities.forEach((authorityItem) => {
      if (typeof authorityItem === 'string') {
        values.push(authorityItem);
      } else if (authorityItem && typeof authorityItem === 'object' && typeof authorityItem.authority === 'string') {
        values.push(authorityItem.authority);
      }
    });
  }

  return values
    .map((item) => String(item || '').trim().toUpperCase())
    .filter(Boolean);
};

const collectRolesFromToken = (token) => {
  if (!token || typeof token !== 'string') return [];

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return [];

    const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    const tokenRoles = [];

    if (typeof payload.role === 'string') {
      tokenRoles.push(payload.role);
    }

    if (Array.isArray(payload.roles)) {
      payload.roles.forEach((roleValue) => {
        if (typeof roleValue === 'string') {
          tokenRoles.push(roleValue);
        }
      });
    }

    if (Array.isArray(payload.authorities)) {
      payload.authorities.forEach((authorityValue) => {
        if (typeof authorityValue === 'string') {
          tokenRoles.push(authorityValue);
        }
      });
    }

    return tokenRoles
      .map((item) => String(item || '').trim().toUpperCase())
      .filter(Boolean);
  } catch {
    return [];
  }
};

export default function PartnerRouteGuard({ children }) {
  const router = useRouter();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);

  const hasPartnerRole = useMemo(() => {
    const roles = [
      ...collectRoles(user),
      ...collectRolesFromToken(token),
    ];
    return roles.some((roleName) => PARTNER_ROLE_SET.has(roleName));
  }, [token, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/partner');
      return;
    }

    if (!hasPartnerRole) {
      router.replace('/');
    }
  }, [hasPartnerRole, isAuthenticated, router]);

  if (!isAuthenticated || !hasPartnerRole) {
    return (
      <div className={styles.guardState}>
        <div className={styles.spinner} />
        <p>Đang kiểm tra quyền truy cập Partner...</p>
      </div>
    );
  }

  return children;
}
