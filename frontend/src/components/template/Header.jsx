import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Popover from '@mui/material/Popover';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import RefreshIcon from '@mui/icons-material/Refresh';
import { motion } from 'framer-motion';
import { DateCarousel } from '../plan';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import { getSales } from '../../utils/auth';
import { useAuth } from '../../utils/useAuth';
import { apiRequest } from '../../services/api';
import { useActivityPlans } from '../../contexts/ActivityPlanContext';
import logoPiagam from '../../assets/media/logo-piagam2.svg';
// import backgroundHeader from '../../assets/media/bgh1.svg';
import { downloadDashboardPdf } from '../../utils/dashboardExport';
import DashboardDownloadDialog from '../dashboard/DashboardDownloadDialog';
import {
  DASHBOARD_PERIOD_OPTIONS,
  DEFAULT_DASHBOARD_PERIOD,
  getDashboardPeriodKey,
} from '../../constants/dashboardPeriods';

export default function Header({
  calendarAnchorEl,
  onCalendarClick,
  onCalendarClose,
  pickerDate,
  onPickerDateChange,
  selectedDate,
  onDateChange,
  onRefresh,
  dashboardPeriod,
  onDashboardPeriodChange,
  dashboardProvince,
  onDashboardProvinceChange,
  dashboardProvinceOptions,
}) {
  const headerBaseColor = '#163a6b';
  const themeBlueDark = headerBaseColor;
  const themeBlueOverlay = themeBlueDark;
  const textOnBluePrimary = 'var(--text-on-blue-primary)';
  const textOnBlueAccent = 'var(--text-on-blue-accent)';
  const planDoneAccent = 'var(--plan-done-accent)';

  const location = useLocation();
  const [logoutMenuAnchorEl, setLogoutMenuAnchorEl] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [periodAnchorEl, setPeriodAnchorEl] = useState(null);
  const [provinceAnchorEl, setProvinceAnchorEl] = useState(null);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [isDownloadingDashboard, setIsDownloadingDashboard] = useState(false);

  const { invalidateCache, fetchAllPlans, fetchPlansByDate } = useActivityPlans();

  const { sales } = useAuth();
  const salesName = (sales && sales.name) ? sales.name : 'Sales';

  const isPlanPage = location.pathname.startsWith('/plan');
  const isDashboardPage = location.pathname === '/';
  const safeLogoutMenuAnchorEl = logoutMenuAnchorEl?.isConnected ? logoutMenuAnchorEl : null;
  const safePeriodAnchorEl = periodAnchorEl?.isConnected ? periodAnchorEl : null;
  const safeProvinceAnchorEl = provinceAnchorEl?.isConnected ? provinceAnchorEl : null;
  const safeCalendarAnchorEl = calendarAnchorEl?.isConnected ? calendarAnchorEl : null;
  const isLogoutMenuOpen = Boolean(safeLogoutMenuAnchorEl);

  const periodValue = dashboardPeriod || DEFAULT_DASHBOARD_PERIOD;
  const provinceValue = dashboardProvince || 'Semua Provinsi';
  const periodOptions = DASHBOARD_PERIOD_OPTIONS;
  const provinceOptions = Array.isArray(dashboardProvinceOptions) && dashboardProvinceOptions.length > 0
    ? dashboardProvinceOptions
    : ['All States'];

  const bottomControlHeight = { xs: 52, sm: 56, md: 60 };
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return 'Selamat pagi!';
    if (hour >= 12 && hour < 15) return 'Selamat siang!';
    if (hour >= 15 && hour < 19) return 'Selamat sore!';
    return 'Selamat malam!';
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setLogoutMenuAnchorEl(null);
    setPeriodAnchorEl(null);
    setProvinceAnchorEl(null);
    setIsDownloadDialogOpen(false);
  }, [location.pathname]);

  const handleLogoutMenuClick = (event) => {
    if (event && event.currentTarget) {
      setLogoutMenuAnchorEl(event.currentTarget);
    }
  };

  const handleLogoutMenuClose = () => {
    setLogoutMenuAnchorEl(null);
  };

  const handleBackToPilarGroup = () => {
    handleLogoutMenuClose();
    window.location.assign('https://pilargroup.id/');
  };

  const handlePeriodClick = (event) => {
    if (event?.currentTarget) setPeriodAnchorEl(event.currentTarget);
  };

  const handlePeriodClose = () => {
    setPeriodAnchorEl(null);
  };

  const handlePeriodChange = (value) => {
    if (typeof onDashboardPeriodChange === 'function') {
      onDashboardPeriodChange(value);
    }
    handlePeriodClose();
  };

  const handleProvinceClick = (event) => {
    if (event?.currentTarget) setProvinceAnchorEl(event.currentTarget);
  };

  const handleProvinceClose = () => {
    setProvinceAnchorEl(null);
  };

  const handleProvinceChange = (value) => {
    if (typeof onDashboardProvinceChange === 'function') {
      onDashboardProvinceChange(value);
    }
    handleProvinceClose(); 
  };

  const handleDownloadDialogOpen = () => {
    setIsDownloadDialogOpen(true);
  };

  const handleDownloadDialogClose = () => {
    if (isDownloadingDashboard) {
      return;
    }

    setIsDownloadDialogOpen(false);
  };

  const handleDashboardDownload = async (periodLabel) => {
    if (!sales?.internal_id) {
      return {
        ok: false,
        message: 'Data user tidak ditemukan. Silakan login ulang.',
      };
    }

    try {
      setIsDownloadingDashboard(true);

      const exportPeriodKey = getDashboardPeriodKey(periodLabel);
      const query = new URLSearchParams({
        sales_internal_id: sales.internal_id,
        period: exportPeriodKey,
        province: provinceValue,
      }).toString();
      const response = await apiRequest(`dashboard/customer-visits-weekly-export?${query}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch weekly export data (${response.status})`);
      }

      const payload = await response.json();

      downloadDashboardPdf({
        exportData: payload?.data ?? null,
        periodLabel,
        provinceLabel: provinceValue,
        userName: sales?.name || sales?.username || '',
      });

      return { ok: true };
    } catch (error) {
      console.error('Error downloading dashboard PDF:', error);
      return {
        ok: false,
        message: 'File gagal disiapkan. Coba lagi dalam beberapa saat.',
      };
    } finally {
      setIsDownloadingDashboard(false);
    }
  };

  const handleHeaderActionClick = (event) => {
    if (!isDashboardPage) {
      if (typeof onCalendarClick === 'function') {
        onCalendarClick(event);
      }
      return;
    }

    if (isDownloadingDashboard || !sales?.internal_id) {
      return;
    }

    handleDownloadDialogOpen();
  };

  const handleReset = async () => {
    try {
      // Trigger shared refresh key for any page that listens to it.
      if (typeof onRefresh === 'function') {
        onRefresh();
      }

      invalidateCache();

      await fetchAllPlans(true, true);

      if (selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())) {
        await fetchPlansByDate(selectedDate, true, true);
      }

      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: themeBlueDark,
          boxShadow: '0 10px 28px rgba(10, 28, 53, 0.3)',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            // backgroundImage: `url(${backgroundHeader})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.6,
            pointerEvents: 'none',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(31,78,140,0.10) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.08) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
        }}
      >
        <Box
          component="img"
          src={logoPiagam}
          alt=""
          aria-hidden="true"
          sx={{
            position: 'absolute',
            top: { xs: -50, sm: -72, md: -90 },
            left: { xs: -52, sm: -42, md: -28 },
            width: { xs: 170, sm: 220, md: 280 },
            height: 'auto',
            opacity: 0.24,
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
          }}
        />

        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            minHeight: { xs: '58px', sm: '62px', md: '66px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 2.5 },
            py: { xs: 1, sm: 1.2 },
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 20% 50%, rgba(31,78,140,0.18) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse at 80% 50%, rgba(31,78,140,0.10) 0%, transparent 60%)',
              pointerEvents: 'none',
              zIndex: 0,
            },
          }}
        >
          {/* LEFT SIDE - Logo and Greeting */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.25, sm: 1.5, md: 1.75 },
              }}
            >
              {/* Greeting and User Info */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.25,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                    fontWeight: 400,
                    color: textOnBlueAccent,
                    lineHeight: 1.2,
                  }}
                >
                  {getGreeting()}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Box
                    component="button"
                    type="button"
                    onClick={handleLogoutMenuClick}
                    aria-haspopup="menu"
                    aria-expanded={isLogoutMenuOpen ? 'true' : undefined}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.15,
                      p: 0,
                      m: 0,
                      border: 'none',
                      background: 'transparent',
                      color: textOnBluePrimary,
                      cursor: 'pointer',
                      '&:focus-visible': {
                        outline: '2px solid rgba(255,255,255,0.6)',
                        outlineOffset: 3,
                        borderRadius: '6px',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: { xs: 20, sm: 22, md: 24 },
                        height: { xs: 20, sm: 22, md: 24 },
                        mr: 0.25,
                      }}
                    >
                      <AccountCircleOutlinedIcon
                        sx={{
                          fontSize: { xs: '1.05rem', sm: '1.15rem', md: '1.25rem' },
                          color: textOnBluePrimary,
                          opacity: 0.95,
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          right: { xs: -0.5, sm: -0.5, md: -1 },
                          bottom: { xs: 0, sm: 0.25, md: 0.25 },
                          width: { xs: 7, sm: 8, md: 8 },
                          height: { xs: 7, sm: 8, md: 8 },
                          borderRadius: '50%',
                          backgroundColor: planDoneAccent,
                          border: `1.5px solid ${themeBlueOverlay}`,
                          boxShadow: `0 0 0 1px ${planDoneAccent}55`,
                        }}
                      />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: '"Inter", sans-serif',
                        fontSize: { xs: '0.80rem', sm: '0.90rem', md: '1.0rem' },
                        fontWeight: 700,
                        color: textOnBluePrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {salesName}
                    </Typography>
                    <ExpandMoreIcon
                      sx={{
                        fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                        color: textOnBluePrimary,
                        transition: 'transform 200ms ease',
                        transform: isLogoutMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* RIGHT SIDE - Time and Action Icon */}
          <Box
            component={motion.div}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            sx={{
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
            }}
          >
            {/* Current Time */}
            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                alignItems: 'center',
                gap: 0.75,
                px: { sm: 1.5, md: 2 },
                py: 0.6,
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <AccessTimeIcon
                sx={{
                  color: textOnBlueAccent,
                  fontSize: { sm: '16px', md: '18px' },
                }}
              />
              <Typography
                sx={{
                  fontFamily: '"Inter", sans-serif',
                  fontSize: { sm: '0.75rem', md: '0.8rem' },
                  fontWeight: 500,
                  color: textOnBlueAccent,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {format(currentTime, 'HH:mm')}
              </Typography>
            </Box>

            {/* Calendar for Plan / Download for Dashboard */}
            <IconButton
              onClick={handleHeaderActionClick}
              disabled={isDashboardPage && (isDownloadingDashboard || !sales?.internal_id)}
              aria-label={isDashboardPage ? 'download dashboard pdf' : 'open calendar'}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderColor: 'rgba(255,255,255,0.16)',
                },
              }}
            >
              {isDashboardPage ? (
                <FileDownloadOutlinedIcon
                  sx={{
                    color: 'white',
                    fontSize: { xs: '18px', sm: '20px', md: '22px' },
                  }}
                />
              ) : (
                <CalendarTodayIcon
                  sx={{
                    color: 'white',
                    fontSize: { xs: '18px', sm: '20px', md: '22px' },
                  }}
                />
              )}
            </IconButton>

            {/* Reset Icon Button */}
            <IconButton
              onClick={handleReset}
              sx={{
                width: { xs: 36, sm: 40, md: 42 },
                height: { xs: 36, sm: 40, md: 42 },
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderColor: 'rgba(255,255,255,0.3)',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <RefreshIcon
                sx={{
                  color: 'white',
                  fontSize: { xs: '18px', sm: '20px', md: '22px' },
                }}
              />
            </IconButton>
          </Box>
        </Box>
        
        {/* Divider */}
        <Divider
          sx={{
            borderColor: 'rgba(255,255,255,0.15)',
            mx: { xs: 2, sm: 2.5 },
            opacity: 0.6,
          }}
        />

        {/* BOTTOM AREA: DateCarousel (Plan) / Filters (Dashboard) */}
        {(isPlanPage || isDashboardPage) && (
          <Box
            sx={{
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 0.5, sm: 0.7 },
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                // backgroundImage: `url(${backgroundHeader})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 0.6,
                pointerEvents: 'none',
                zIndex: 0,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(31,78,140,0.06) 50%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 0,
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {isPlanPage ? (
                <DateCarousel
                  selectedDate={selectedDate}
                  onDateChange={onDateChange}
                  height={bottomControlHeight}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: bottomControlHeight,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: { xs: 0.75, sm: 1 },
                    overflow: 'visible',
                  }}
                >
                  <Button
                    onClick={handlePeriodClick}
                    variant="contained"
                    disableElevation
                    startIcon={<AccessTimeIcon />}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transition: 'transform 200ms ease',
                          transform: safePeriodAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    }
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: textOnBluePrimary,
                      borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                      px: 1.5,
                      py: 0.9,
                      border: '2px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '& .MuiButton-startIcon': { color: textOnBlueAccent },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <Typography sx={{ fontSize: { xs: '0.46rem', sm: '0.5rem', md: '0.54rem' }, fontWeight: 500, color: textOnBlueAccent, lineHeight: 1.15 }}>
                        Periode
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' },
                          fontWeight: 500,
                          color: textOnBluePrimary,
                          lineHeight: 1.15,
                        }}
                        noWrap
                      >
                        {periodValue}
                      </Typography>
                    </Box>
                  </Button>

                  <Button
                    onClick={handleProvinceClick}
                    variant="contained"
                    disableElevation
                    startIcon={<LocationOnIcon />}
                    endIcon={
                      <ExpandMoreIcon
                        sx={{
                          transition: 'transform 200ms ease',
                          transform: safeProvinceAnchorEl ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}
                      />
                    }
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: textOnBluePrimary,
                      borderRadius: { xs: '12px', sm: '14px', md: '16px' },
                      px: 1.5,
                      py: 0.9,
                      border: '2px solid rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                      '& .MuiButton-startIcon': { color: textOnBlueAccent },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <Typography sx={{ fontSize: { xs: '0.46rem', sm: '0.5rem', md: '0.54rem' }, fontWeight: 500, color: textOnBlueAccent, lineHeight: 1.15 }}>
                        Provinsi
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.66rem' },
                          fontWeight: 500,
                          color: textOnBluePrimary,
                          lineHeight: 1.15,
                        }}
                        noWrap
                        title={provinceValue}
                      >
                        {provinceValue}
                      </Typography>
                    </Box>
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* LOGOUT MENU DROPDOWN */}
      {safeLogoutMenuAnchorEl && (
        <Menu
          anchorEl={safeLogoutMenuAnchorEl}
          open={isLogoutMenuOpen}
          onClose={handleLogoutMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 190,
              boxShadow: '0 6px 24px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08)',
              borderRadius: '14px',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
            },
          }}
          MenuListProps={{
            sx: {
              py: 0.5,
            },
          }}
        >
          <MenuItem
            onClick={handleBackToPilarGroup}
            sx={{
              py: 1.25,
              px: 2,
              gap: 0.2,
              borderRadius: '10px',
              mx: 0.5,
              my: 0.25,
              '&:hover': {
                backgroundColor: 'rgba(31, 78, 140, 0.10)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 24 }}>
              <LogoutIcon
                sx={{
                  color: 'text.secondary',
                  fontSize: 22,
                  transform: 'scaleX(-1)',
                }}
              />
            </ListItemIcon>
            <ListItemText
              primary="Back Pilargroup"
              primaryTypographyProps={{
                fontSize: '0.95rem',
                fontWeight: 500,
                color: 'text.primary',
              }}
            />
          </MenuItem>
        </Menu>
      )}

      {/* DASHBOARD FILTER MENUS */}
      {isDashboardPage && (
        <>
          <Menu
            anchorEl={safePeriodAnchorEl}
            open={Boolean(safePeriodAnchorEl)}
            onClose={handlePeriodClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 220,
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            {periodOptions.map((option) => (
              <MenuItem
                key={option}
                selected={option === periodValue}
                onClick={() => handlePeriodChange(option)}
                sx={{ fontSize: { xs: '0.62rem', sm: '0.66rem' } }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>

          <Menu
            anchorEl={safeProvinceAnchorEl}
            open={Boolean(safeProvinceAnchorEl)}
            onClose={handleProvinceClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 240,
                maxHeight: 360,
                borderRadius: '14px',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
              },
            }}
          >
            {provinceOptions.map((option) => (
              <MenuItem
                key={option}
                selected={option === provinceValue}
                onClick={() => handleProvinceChange(option)}
                sx={{ fontSize: { xs: '0.62rem', sm: '0.66rem' } }}
              >
                {option}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}

      <DashboardDownloadDialog
        open={isDashboardPage && isDownloadDialogOpen}
        onClose={handleDownloadDialogClose}
        onConfirm={handleDashboardDownload}
        provinceLabel={provinceValue}
        isDownloading={isDownloadingDashboard}
      />

      {/* DATE PICKER */}
      <Popover
        open={Boolean(safeCalendarAnchorEl)}
        anchorEl={safeCalendarAnchorEl}
        onClose={onCalendarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        keepMounted
      >
        <Box sx={{ p: 2 }}>
          <DatePicker
            value={pickerDate}
            onChange={onPickerDateChange}
            slotProps={{
              textField: {
                size: 'small',
                sx: { width: 250 },
              },
            }}
          />
        </Box>
      </Popover>
    </>
  );
}

