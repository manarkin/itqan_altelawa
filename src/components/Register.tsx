import React, { useState } from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  User as UserIcon, 
  Briefcase, 
  Image as ImageIcon, 
  Mic, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import MaskedPasswordInput from './MaskedPasswordInput';

interface RegisterProps {
  navigate: (view: string) => void;
  lang: 'ar' | 'en';
  t: () => any;
  setUser?: (user: any) => void;
  setAllStudents?: React.Dispatch<React.SetStateAction<any[]>>;
  setAllTeachers?: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function Register({
  navigate,
  lang,
  t,
  setUser,
  setAllStudents,
  setAllTeachers
}: RegisterProps) {
  const [regRole, setRegRole] = useState<'student' | 'teacher'>('student');
  const [regStudentType, setRegStudentType] = useState<'undergrad' | 'postgrad'>('undergrad');
  const [regFirstTime, setRegFirstTime] = useState<'yes' | 'no'>('yes');
  const [selectedCollege, setSelectedCollege] = useState('');
  
  // Custom attachment names to simulate real file drops
  const [cardPicName, setCardPicName] = useState('');
  const [voiceFileName, setVoiceFileName] = useState('');

  // Wired input field states
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentFatherName, setStudentFatherName] = useState('');
  const [studentGrandfatherName, setStudentGrandfatherName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentConfirmPassword, setStudentConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentCohort, setStudentCohort] = useState('');

  const [teacherFirstName, setTeacherFirstName] = useState('');
  const [teacherFatherName, setTeacherFatherName] = useState('');
  const [teacherGrandfatherName, setTeacherGrandfatherName] = useState('');
  const [teacherLastName, setTeacherLastName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherConfirmPassword, setTeacherConfirmPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [teacherCollege, setTeacherCollege] = useState('');
  const [teacherManualCollege, setTeacherManualCollege] = useState('');
  const [teacherLevel, setTeacherLevel] = useState('طالبة اقراء');
  const [teacherCohort, setTeacherCohort] = useState('not_applicable');

  const isAr = lang === 'ar';
  const tField = (ar: string, en: string) => isAr ? ar : en;

  const colleges = isAr 
    ? [
        "العلوم الزراعية والبحرية",
        "الآداب والعلوم الاجتماعية",
        "الإقتصاد والعلوم السياسية",
        "التربية",
        "الهندسة",
        "الحقوق",
        "الطب والعلوم الصحية",
        "العلوم",
        "التمريض"
      ] 
    : [
        "Agricultural and Marine Sciences",
        "Arts and Social Sciences",
        "Economics and Political Science",
        "Education",
        "Engineering",
        "Law",
        "Medicine and Health Sciences",
        "Science",
        "Nursing"
      ];

  const formatOMPhone = (val: string): string => {
    const cleanDigits = val.replace(/\D/g, '');
    if (cleanDigits.length === 0) return '';
    let finalDigits = cleanDigits;
    if (finalDigits[0] !== '9' && finalDigits[0] !== '7') {
      finalDigits = finalDigits.slice(1);
      return formatOMPhone(finalDigits);
    }
    finalDigits = finalDigits.slice(0, 8);
    if (finalDigits.length > 4) {
      return `${finalDigits.slice(0, 4)} ${finalDigits.slice(4)}`;
    }
    return finalDigits;
  };

  const handleCardPicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCardPicName(e.target.files[0].name);
    }
  };

  const handleVoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVoiceFileName(e.target.files[0].name);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (regRole === 'student') {
      if (studentPassword.length < 6) {
        alert(tField('يجب ألا تقل كلمة المرور عن 6 أحرف!', 'Password cannot be less than 6 characters!'));
        return;
      }

      if (studentPassword !== studentConfirmPassword) {
        alert(tField('كلمتا المرور غير متطابقتين!', 'Passwords do not match!'));
        return;
      }

      const cleanPhone = studentPhone.replace(/\s+/g, '');
      if (cleanPhone.length !== 8) {
        alert(tField('يجب أن يتكون رقم الهاتف من 8 أرقام تبدأ بـ 9 أو 7!', 'Phone number must be exactly 8 digits starting with 9 or 7!'));
        return;
      }

      const finalStudentId = studentId || Math.floor(100000 + Math.random() * 900000).toString();
      const newUser = {
        firstName: studentFirstName,
        fatherName: studentFatherName,
        grandfatherName: studentGrandfatherName,
        lastName: studentLastName,
        role: 'STUDENT',
        email: studentEmail,
        isEnrolled: false,
        phone: studentPhone,
        college: selectedCollege || 'OTHER',
        cohort: studentCohort || '2023',
        studentId: finalStudentId,
        level: tField('غير مصنف', 'Not Categorized'),
        username: finalStudentId,
        password: studentPassword,
        avatar: 'https://picsum.photos/seed/student_new/200/200',
        cardPicName: cardPicName || 'student_id_upload.png',
        voiceFileName: voiceFileName || (regFirstTime === 'yes' ? 'sample_voice.mp3' : ''),
        approved: false, // starts as Not Checked
        isNew: true
      };

      // Save both by email and by username
      localStorage.setItem('registered_user_' + studentEmail.toLowerCase(), JSON.stringify(newUser));
      localStorage.setItem('registered_user_' + finalStudentId.toLowerCase(), JSON.stringify(newUser));
      if (setAllStudents) {
        setAllStudents(prev => [...prev, newUser]);
      }
      if (setUser) {
        setUser(newUser);
      }
    } else {
      if (teacherPassword.length < 6) {
        alert(tField('يجب ألا تقل كلمة المرور عن 6 أحرف!', 'Password cannot be less than 6 characters!'));
        return;
      }

      if (teacherPassword !== teacherConfirmPassword) {
        alert(tField('كلمتا المرور غير متطابقتين!', 'Passwords do not match!'));
        return;
      }

      const cleanPhone = teacherPhone.replace(/\s+/g, '');
      if (cleanPhone.length !== 8) {
        alert(tField('يجب أن يتكون رقم الهاتف من 8 أرقام تبدأ بـ 9 أو 7!', 'Phone number must be exactly 8 digits starting with 9 or 7!'));
        return;
      }

      const finalTeacherId = teacherId || Math.floor(100000 + Math.random() * 900000).toString();
      const newUser = {
        firstName: teacherFirstName,
        fatherName: teacherFatherName,
        grandfatherName: teacherGrandfatherName,
        lastName: teacherLastName,
        role: 'TEACHER',
        email: teacherEmail,
        isEnrolled: false,
        phone: teacherPhone,
        college: teacherCollege === 'أخرى' ? (teacherManualCollege || 'Other') : (teacherCollege || 'Education'),
        cohort: teacherCohort,
        employeeId: finalTeacherId,
        level: teacherLevel,
        username: finalTeacherId,
        password: teacherPassword,
        avatar: 'https://picsum.photos/seed/teacher_new/200/200',
        approved: false, // starts as Not Checked
        isNew: true
      };

      // Save both by email and by username
      localStorage.setItem('registered_user_' + teacherEmail.toLowerCase(), JSON.stringify(newUser));
      localStorage.setItem('registered_user_' + finalTeacherId.toLowerCase(), JSON.stringify(newUser));
      if (setAllTeachers) {
        setAllTeachers(prev => [...prev, newUser]);
      }
      if (setUser) {
        setUser(newUser);
      }
    }

    navigate('success');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 select-none text-start">
      <div className="bg-white rounded-3xl border border-brand-primary/15 shadow-xl p-6 sm:p-10">
        
        {/* Registration Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-brand-dark mb-2">
            {tField('إنشاء حساب جديد', 'Register Now')}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm font-bold">
            {tField('انضمي إلينا في رحلة التميز وإتقان التلاوة القرآنية للغواية والتمكين بجامعة السلطان قابوس', 'Join us in our journey of mastering Quranic Recitation')}
          </p>

          {/* Primary Role Selector (cards) */}
          <div className="flex gap-3 justify-center mt-6">
            <button 
              type="button"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all border-2 cursor-pointer ${
                regRole === 'student' 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-gray-400 border-gray-150 hover:bg-gray-50'
              }`}
              onClick={() => setRegRole('student')}
            >
              <GraduationCap className="w-4.5 h-4.5" />
              <span>{tField('طالبة مقيدة بنادي مسك', 'Student')}</span>
            </button>

            <button 
              type="button"
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all border-2 cursor-pointer ${
                regRole === 'teacher' 
                  ? 'bg-brand-primary text-white border-brand-primary' 
                  : 'bg-white text-gray-400 border-gray-150 hover:bg-gray-50'
              }`}
              onClick={() => setRegRole('teacher')}
            >
              <BookOpen className="w-4.5 h-4.5" />
              <span>{tField('معلمة ومحفظة متطوعة', 'Teacher')}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Form Sections */}
        {regRole === 'student' ? (
          <div>
            {/* Student Category First selection */}
            <div className="p-4 rounded-2xl bg-brand-primary/[0.03] border border-brand-primary/10 mb-8 text-start">
              <h5 className="font-extrabold text-brand-dark flex items-center gap-2 mb-3.5 text-sm sm:text-base">
                <ChevronRight className="text-brand-primary w-5 h-5" />
                {tField('يرجى تحديد فئة الطالبة أولاً للقبول المقيد:', 'Please select student category first:')}
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 select-none">
                {/* undergrad block */}
                <div 
                  className={`p-2.5 px-4 rounded-xl border-2 cursor-pointer hover:scale-101 transition-transform ${
                    regStudentType === 'undergrad' 
                      ? 'border-brand-primary bg-brand-primary/[0.05]' 
                      : 'border-gray-150 bg-white'
                  }`}
                  onClick={() => setRegStudentType('undergrad')}
                >
                  <div className="flex items-center gap-3">
                    <UserIcon className="text-brand-primary w-5 h-5 shrink-0" />
                    <div className="text-start">
                      <h6 className="font-black text-brand-dark text-[11px] sm:text-xs mb-0.5">
                        {tField('طالبة دراسات أولية (بكالوريوس)', 'Undergraduate Student')}
                      </h6>
                      <p className="text-[9px] text-gray-400 font-bold leading-none">SQU Bachelor Students</p>
                    </div>
                  </div>
                </div>

                {/* postgraduate / work block */}
                <div 
                  className={`p-2.5 px-4 rounded-xl border-2 cursor-pointer hover:scale-101 transition-transform ${
                    regStudentType === 'postgrad' 
                      ? 'border-brand-primary bg-brand-primary/[0.05]' 
                      : 'border-gray-150 bg-white'
                  }`}
                  onClick={() => setRegStudentType('postgrad')}
                >
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-brand-primary w-5 h-5 shrink-0" />
                    <div className="text-start">
                      <h6 className="font-black text-brand-dark text-[11px] sm:text-xs mb-0.5">
                        {tField('طالبة دراسات عليا / موظفة من الجامعة', 'Postgraduate / SQU Employee')}
                      </h6>
                      <p className="text-[9px] text-gray-400 font-bold leading-none">Postgrad / SQU Employee</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Student form action */}
            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Name Details Fields row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('الاسم الأول', 'First Name')}
                  </label>
                  <input 
                    type="text" 
                    value={studentFirstName}
                    onChange={(e) => setStudentFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    required 
                    placeholder={tField('مثال: مريم', 'e.g. Maryam')}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1 font-bold">
                    {tField('اسم الأب', 'Father\'s Name')}
                  </label>
                  <input 
                    type="text" 
                    value={studentFatherName}
                    onChange={(e) => setStudentFatherName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    required 
                    placeholder={tField('مثال: يوسف', 'e.g. Yousuf')}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('اسم الجد', "Grandfather's Name")}
                  </label>
                  <input 
                    type="text" 
                    value={studentGrandfatherName}
                    onChange={(e) => setStudentGrandfatherName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    required 
                    placeholder={tField('مثال: أحمد', 'e.g. Ahmed')}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('اسم العائلة (اللقب)', 'Family Name')}
                  </label>
                  <input 
                    type="text" 
                    value={studentLastName}
                    onChange={(e) => setStudentLastName(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    required 
                    placeholder={tField('مثال: الهنائية', 'e.g. Al-Hinai')}
                  />
                </div>
              </div>

              {/* Email & Phone ContactRow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('البريد الإلكتروني للجامعة', 'Email Address')}
                  </label>
                  <input 
                    type="email" 
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                    placeholder="s123456@student.squ.edu.om"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('رقم الهاتف والتواصل (WhatsApp)', 'Phone Number')}
                  </label>
                  <input 
                    type="tel" 
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(formatOMPhone(e.target.value))}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                    placeholder="9123 4567"
                  />
                </div>
              </div>



              {/* ID & College Choice row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {regStudentType === 'undergrad' ? tField('الرقم الجامعي مقيد', 'Student ID') : tField('الرقم الجامعي / الوظيفي الساري', 'Student ID / Work ID')}
                  </label>
                  <input 
                    type="text" 
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                    maxLength={6}
                    placeholder={regStudentType === 'undergrad' ? '123456' : '102934'}
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {regStudentType === 'undergrad' ? tField('الكلية الجامعية بالجامعة', 'SQU College') : tField('الكلية / جهة العمل الحالية', 'Workplace / SQU College')}
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    required
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                  >
                    <option value="" disabled>{tField('اختر الكلية بالجامعة...', 'Select SQU College...')}</option>
                    {colleges.map((c, idx) => (
                      <option key={idx} value={c}>{c}</option>
                    ))}
                    {regStudentType === 'postgrad' && (
                      <option value="أخرى">{tField('أخرى (جهة خارجية أو جهة عمل خاصة)', 'Others / Manual Workplace')}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Conditional manual workplace selection */}
              {selectedCollege === 'أخرى' && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 animate-fade-in">
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('يرجى تحديد وكتابة جهة العمل أو المؤسسة الحالية بالتفصيل:', 'Please specify current workplace context details:')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                    placeholder={tField('مثال: وزارة التربية والتعليم - مسقط', 'e.g. Ministry of Education - Muscat')}
                    required
                  />
                </div>
              )}

              {/* Cohort input field (only undergraduate) */}
              {regStudentType === 'undergrad' && (
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1 font-bold">
                    {tField('الدفعة الأكاديمية بالجامعة (Cohort Year)', 'Cohort Year')}
                  </label>
                  <select 
                    value={studentCohort}
                    onChange={(e) => setStudentCohort(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                  >
                    <option value="">{tField('اختر الدفعة', 'Select Cohort')}</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                    <option value="2023">2023</option>
                    <option value="2022">2022</option>
                    <option value="2021">2021</option>
                    <option value="2020">2020</option>
                    <option value="2019">2019</option>
                    <option value="2018 and before">{tField('2018 وقبل ذلك', '2018 and before')}</option>
                  </select>
                </div>
              )}

              {/* Drag n drop Student University Card photo */}
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1.5 font-bold">
                  {regStudentType === 'undergrad' ? tField('صورة البطاقة الجامعية', 'University Card Photo') : tField('صورة البطاقة الجامعية / بطاقة العمل السارية', 'Student Card or Job ID Card Photo')}
                </label>
                <div 
                  className="p-6 rounded-2xl border-2 border-dashed border-brand-primary/30 text-center hover:bg-brand-neutral/20 transition-all select-none cursor-pointer flex flex-col items-center"
                  onClick={() => document.getElementById('cardPicFile')?.click()}
                >
                  <ImageIcon className="text-brand-primary w-8 h-8 mb-2 animate-bounce" />
                  <span className="text-xs font-extrabold text-brand-dark block mb-1">
                    {cardPicName || tField('انقري هنا لإرفاق صورة البطاقة الجامعية لتوثيق فئتكِ', 'Click here to upload your university ID Card photo')}
                  </span>
                  <span className="text-[0.65rem] text-gray-400 font-bold block">PNG, JPG, JPEG (Max 5MB)</span>
                  <input 
                    type="file" 
                    id="cardPicFile" 
                    className="sr-only" 
                    accept="image/*"
                    onChange={handleCardPicChange}
                    required
                  />
                </div>
              </div>

              {/* Yes no: First time in club? */}
              <div className="space-y-2 pt-2 text-start select-none">
                <label className="text-xs font-black text-gray-400 block font-bold">
                  {tField('هل هذه هي أول مرة تلتحقين فيها بنادي مسك؟', 'Is this your first time in Misk Club?')}
                </label>
                <div className="flex gap-3">
                  <button 
                    type="button" 
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-sm border cursor-pointer ${
                      regFirstTime === 'yes' 
                        ? 'bg-brand-primary text-white border-brand-primary font-black' 
                        : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50'
                    }`}
                    onClick={() => setRegFirstTime('yes')}
                  >
                    {t().yes}
                  </button>
                  <button 
                    type="button" 
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-sm border cursor-pointer ${
                      regFirstTime === 'no' 
                        ? 'bg-brand-primary text-white border-brand-primary font-black' 
                        : 'bg-white text-gray-500 border-gray-150 hover:bg-gray-50'
                    }`}
                    onClick={() => setRegFirstTime('no')}
                  >
                    {t().no}
                  </button>
                </div>
              </div>

              {/* Drag n drop Recitation Voice Audio file (conditional on first time) */}
              {regFirstTime === 'yes' && (
                <div className="animate-fade-in">
                  <label className="text-xs font-black text-gray-400 block mb-1.5 font-bold">
                    {tField('الملف الصوتي للتلاوة وتقييم المستوى (اختياري)', 'Recitation Sound Sample File (Optional)')}
                  </label>
                  <div 
                    className="p-6 rounded-2xl border-2 border-dashed border-brand-primary/30 text-center hover:bg-brand-neutral/20 transition-all select-none cursor-pointer flex flex-col items-center"
                    onClick={() => document.getElementById('voiceFile')?.click()}
                  >
                    <Mic className="text-brand-primary w-8 h-8 mb-2 animate-pulse" />
                    <span className="text-xs font-extrabold text-brand-dark block mb-1">
                      {voiceFileName || tField('انقري هنا لإرفاق ملف تلاوتك الصوتي الخاص بآيات قصيرة (اختياري)', 'Click here or drag recitation audio file (Optional)')}
                    </span>
                    <span className="text-[0.65rem] text-gray-400 font-bold block">MP3, M4A, WAV, AMR</span>
                    <input 
                      type="file" 
                      id="voiceFile" 
                      className="sr-only" 
                      accept="audio/*"
                      onChange={handleVoiceFileChange}
                    />
                  </div>
                </div>
              )}

              {/* If "No", conditional details */}
              {regFirstTime === 'no' && (
                <div className="p-4 rounded-3xl bg-gray-50 border border-gray-150 grid grid-cols-1 sm:grid-cols-3 gap-4 text-start animate-fade-in select-none">
                  <h6 className="font-extrabold text-brand-dark text-sm sm:col-span-3 mb-1">
                    {tField('تفاصيل الالتحاق والالتقاء الدراسي السابق:', 'Previous Enrollment Context Details:')}
                  </h6>
                  
                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1">
                      {tField('آخر فصل انضمام مقيد؟', 'Last Semester Joined?')}
                    </label>
                    <select className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold" required>
                      <option value="ربيع 2026">{tField('ربيع 2026', 'Spring 2026')}</option>
                      <option value="خريف 2025">{tField('خريف 2025', 'Fall 2025')}</option>
                      <option value="ربيع 2025">{tField('ربيع 2025', 'Spring 2025')}</option>
                      <option value="خريف 2024">{tField('خريف 2024', 'Fall 2024')}</option>
                      <option value="قبيل ذلك">{tField('قبل ذلك', 'Prior Semesters')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1">
                      {tField('ما هو المستوى السابق؟', 'Prior Level Placement?')}
                    </label>
                    <select 
                      className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold" 
                      required 
                    >
                      <option value="">{tField('اختر المستوى السابق', 'Select Prior Level')}</option>
                      <option value="BEGINNER">{tField('مبتدئة (Beginner)', 'Beginner')}</option>
                      <option value="INTERMEDIATE">{tField('متوسطة (Intermediate)', 'Intermediate')}</option>
                      <option value="ADVANCED">{tField('متقدمة (Advanced)', 'Advanced')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-400 block mb-1">
                      {tField('هل تأهلتِ للمرحلة التالية؟', 'Did you qualify?')}
                    </label>
                    <select className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-3 py-2 text-xs font-bold" required>
                      <option value="نعم">{tField('نعم، تأهلت بنجاح', 'Yes')}</option>
                      <option value="لا">{tField('لا، لم أتأهل بعد', 'No')}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Password credentials placed lastly directly as plain inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('كلمة المرور', 'Account Password')}
                  </label>
                  <MaskedPasswordInput 
                    value={studentPassword}
                    onChange={setStudentPassword}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-400 block mb-1">
                    {tField('تأكيد كلمة المرور', 'Confirm Password')}
                  </label>
                  <MaskedPasswordInput 
                    value={studentConfirmPassword}
                    onChange={setStudentConfirmPassword}
                    className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                    required 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Conditions checkboxes */}
              <div className="flex items-start gap-2.5 pt-3">
                <input 
                  type="checkbox" 
                  id="regTermsCheck" 
                  className="w-5 h-5 text-brand-primary border-gray-200 rounded mt-0.5" 
                  required 
                />
                <label htmlFor="regTermsCheck" className="text-xs sm:text-sm font-bold text-gray-500 cursor-pointer select-none leading-relaxed">
                  {tField('أقر بموافقتي التامة على شروط الالتحاق والالتزام بحضور التلاوات والواحبات الفقهية المقررة بنادي مسك بجامعة السلطان قابوس.', 'Do you agree to the terms of enrollment and abide by the club rules?')}
                </label>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  className="w-full py-4 bg-brand-primary hover:bg-brand-accent text-white font-black text-base rounded-2xl shadow-lg shadow-brand-primary/15 transition-all cursor-pointer"
                >
                  {tField('سجل الآن وانضمي إلينا', 'Submit Registration Now')}
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* Teacher Volunteer Registration form */
          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Name Details Fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('الاسم الأول', 'First Name')}</label>
                <input 
                  type="text" 
                  value={teacherFirstName}
                  onChange={(e) => setTeacherFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required 
                  placeholder={tField('مثال: مريم', 'e.g. Maryam')}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1 font-bold">{tField('اسم الأب', "Father's Name")}</label>
                <input 
                  type="text" 
                  value={teacherFatherName}
                  onChange={(e) => setTeacherFatherName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required 
                  placeholder={tField('مثال: سليمان', 'e.g. Sulaiman')}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('اسم الجد', "Grandfather's Name")}</label>
                <input 
                  type="text" 
                  value={teacherGrandfatherName}
                  onChange={(e) => setTeacherGrandfatherName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required 
                  placeholder={tField('مثال: خليفة', 'e.g. Khalifa')}
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('اسم العائلة (اللقب)', 'Family Name')}</label>
                <input 
                  type="text" 
                  value={teacherLastName}
                  onChange={(e) => setTeacherLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required 
                  placeholder={tField('مثال: الهنائية', 'e.g. Al-Hinai')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('البريد الإلكتروني', 'Email Address')}</label>
                <input 
                  type="email" 
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                  placeholder="teacher@recitation.club"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('رقم الهاتف والتواصل', 'Phone Number')}</label>
                <input 
                  type="tel" 
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(formatOMPhone(e.target.value))}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                  placeholder="9123 4567"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">{tField('الرقم الوظيفي للمعلمة', 'Employee ID / Work ID')}</label>
                <input 
                  type="text" 
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                  maxLength={6}
                  placeholder="e.g. 102938"
                />
              </div>
            </div>

            {/* Custom SQU College, Designated Level & Cohort Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('الكلية أو مجال العمل', 'College or Work Area')}
                </label>
                <select 
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required
                  value={teacherCollege}
                  onChange={(e) => setTeacherCollege(e.target.value)}
                >
                  <option value="" disabled>{tField('اختر الكلية أو مجال العمل...', 'Select College or Work Area...')}</option>
                  {colleges.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                  <option value="أخرى">{tField('أخرى', 'Other')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('المستوى / الصفة', 'Level')}
                </label>
                <select 
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  required
                  value={teacherLevel}
                  onChange={(e) => setTeacherLevel(e.target.value)}
                >
                  <option value="مجازة">{tField('مجازة (Certified / Mujazah)', 'Certified / Mujazah')}</option>
                  <option value="طالبة اقراء">{tField('طالبة اقراء (Iqraa Student)', 'Iqraa Student')}</option>
                  <option value="طالبة اقراء في فصلي الأول">{tField('طالبة اقراء في فصلي الأول (Iqraa student in my first semester)', 'Iqraa student in my first semester')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('الدفعة الأكاديمية (Cohort Year)', 'Cohort Year')}
                </label>
                <select 
                  value={teacherCohort}
                  onChange={(e) => setTeacherCohort(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                >
                  <option value="not_applicable">{tField('غير مطبق (Not Applicable)', 'Not Applicable')}</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                  <option value="2021">2021</option>
                  <option value="2020">2020</option>
                  <option value="2019">2019</option>
                  <option value="2018 and before">{tField('2018 وقبل ذلك', '2018 and before')}</option>
                </select>
              </div>
            </div>

            {teacherCollege === 'أخرى' && (
              <div className="animate-fade-in p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('يرجى تحديد الكلية أو مجال العمل الآخر:', 'Please specify other College or Work Area:')}
                </label>
                <input 
                  type="text" 
                  value={teacherManualCollege}
                  onChange={(e) => setTeacherManualCollege(e.target.value)}
                  className="w-full bg-white border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold" 
                  placeholder={tField('مثال: جهة خارجية أو مجال عمل آخر', 'e.g. External organization or other field')}
                  required
                />
              </div>
            )}

            {/* Password credentials placed lastly directly as plain inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('كلمة المرور', 'Account Password')}
                </label>
                <MaskedPasswordInput 
                  value={teacherPassword}
                  onChange={setTeacherPassword}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-1">
                  {tField('تأكيد كلمة المرور', 'Confirm Password')}
                </label>
                <MaskedPasswordInput 
                  value={teacherConfirmPassword}
                  onChange={setTeacherConfirmPassword}
                  className="w-full bg-slate-50 border border-gray-150 focus:border-brand-primary focus:outline-none rounded-xl px-4 py-2.5 text-sm font-bold text-ltr" 
                  required 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                className="w-full py-4 bg-brand-primary hover:bg-brand-accent text-white font-black text-base rounded-2xl shadow-lg transition-all cursor-pointer"
              >
                {tField('سجل الآن وانضمي إلينا', 'Submit Registration Now')}
              </button>
            </div>
          </form>
        )}

        {/* Existing account login trigger at bottom */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center select-none font-bold">
          <p className="text-gray-400 text-xs sm:text-sm mb-0">
            {tField('لديكِ حساب بالفعل؟', 'Already have an account?')}
            <button 
              type="button" 
              className="px-1.5 text-brand-primary hover:text-brand-accent font-black border-none bg-none outline-none text-decoration-none cursor-pointer" 
              onClick={() => navigate('login')}
            >
              {tField('تسجيل الدخول', 'log in')}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}
