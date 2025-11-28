from rest_framework import serializers
import datetime
from .models import Admin, Alumni, ProgramHead, AlumniSurvey, EmploymentRecord, Program


# Accept boolean or 'yes'/'no' for has_own_business and normalize to 'yes'/'no'
class HasOwnBusinessField(serializers.Field):
    def to_internal_value(self, data):
        # Accept booleans, 'true'/'false', 'yes'/'no'
        if data is None:
            return None
        if isinstance(data, bool):
            return 'yes' if data else 'no'
        if isinstance(data, str):
            low = data.strip().lower()
            if low in ('yes', 'y', 'true', '1'):
                return 'yes'
            if low in ('no', 'n', 'false', '0'):
                return 'no'
        raise serializers.ValidationError('Invalid value for has_own_business')

    def to_representation(self, value):
        # Return stored value as-is (should be 'yes'/'no' or None)
        return value

class ProgramSerializer(serializers.ModelSerializer):
    program_head_name = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = ['id', 'program_name', 'program_head', 'faculty', 'status', 'created_at', 'program_head_name']
        read_only_fields = ['created_at']

    def get_program_head_name(self, obj):
        if obj.program_head:
            return f"{obj.program_head.name} {obj.program_head.surname}"
        return None

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = '__all__'


class AlumniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alumni
        # Explicitly list fields so we can control year_graduated behavior
        fields = ['id', 'username', 'email', 'password', 'full_name', 'program_course', 'image', 'year_graduated']
        extra_kwargs = {
            'password': {'write_only': True},
            'year_graduated': {'required': True}
        }

    def validate_year_graduated(self, value):
        # Ensure reasonable year range
        current = datetime.datetime.now().year
        if value is None:
            raise serializers.ValidationError('Year graduated is required')
        if value < 1950 or value > current:
            raise serializers.ValidationError(f'Year graduated must be between 1950 and {current}')
        return value


class ProgramHeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramHead
        fields = '__all__'


class EmploymentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmploymentRecord
        fields = ['id', 'company_name', 'date_employed', 'position_and_status', 'monthly_salary_range']



class AlumniSurveySerializer(serializers.ModelSerializer):
    employment_records = EmploymentRecordSerializer(many=True, required=False)
    # Allow multiple self_employment records as a JSON array (legacy model removed).
    # This field accepts a list of dicts on input but is not persisted to a separate table.
    self_employment = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    # Include a small read-only snapshot of the linked Alumni credentials so frontend
    # can display who submitted the survey without an extra round-trip.
    alumni_info = serializers.SerializerMethodField(read_only=True)
    # Use custom field so boolean true/false from frontend is accepted
    has_own_business = HasOwnBusinessField(required=False, allow_null=True)

    class Meta:
        model = AlumniSurvey
        # Expose all survey model fields. The declared SerializerMethodField
        # `alumni_info` is defined on the serializer and will be included
        # automatically. Mark it read-only so clients cannot set it.
        fields = '__all__'
        read_only_fields = ('alumni_info',)

    def create(self, validated_data):
        employment_data = validated_data.pop('employment_records', [])
        self_emp_data = validated_data.pop('self_employment', [])
        survey = AlumniSurvey.objects.create(**validated_data)
        for rec in employment_data:
            EmploymentRecord.objects.create(survey=survey, **rec)
        return survey

    def update(self, instance, validated_data):
        employment_data = validated_data.pop('employment_records', None)
        self_emp_data = validated_data.pop('self_employment', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if employment_data is not None:
            # Simple strategy: delete existing and recreate
            instance.employment_records.all().delete()
            for rec in employment_data:
                EmploymentRecord.objects.create(survey=instance, **rec)

        if self_emp_data is not None:
            # The SelfEmployment model has been removed; incoming self_employment
            # data will be accepted but not stored in a separate table. If you
            # want to persist these items, consider adding a JSONField to
            # AlumniSurvey and storing them there. For now, ignore on write.
            pass

        return instance

    def get_alumni_info(self, obj):
        # Return a minimal representation of the linked Alumni (if present)
        try:
            a = obj.alumni
            if not a:
                return None
            return {
                'id': a.id,
                'username': getattr(a, 'username', None),
                'email': getattr(a, 'email', None),
                'full_name': getattr(a, 'full_name', None),
                'program_course': getattr(a, 'program_course', None)
            }
        except Exception:
            return None


class SurveyChangeRequestSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import SurveyChangeRequest
        model = SurveyChangeRequest
        fields = ['id', 'alumni', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'status', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import Notification
        model = Notification
        fields = ['id', 'title', 'message', 'payload', 'created_at']
        read_only_fields = ['id', 'created_at']
